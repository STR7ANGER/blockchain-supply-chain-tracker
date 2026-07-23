use std::collections::HashMap;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Proof {
    pub organization: String,
    pub subject: String,
    pub document_hash: [u8; 32],
    pub authority: String,
    pub sequence: u64,
    pub revoked: bool,
}

#[derive(Debug, PartialEq, Eq)]
pub enum RegistryError {
    Unauthorized,
    SequenceConflict,
    SequenceNotMonotonic,
    AlreadyRevoked,
    NotFound,
}

#[derive(Default)]
pub struct Registry {
    authorities: HashMap<String, String>,
    proofs: HashMap<(String, String), Proof>,
    last_sequence: HashMap<String, u64>,
}

impl Registry {
    pub fn set_authority(
        &mut self,
        organization: &str,
        current: Option<&str>,
        next: &str,
    ) -> Result<(), RegistryError> {
        if let Some(existing) = self.authorities.get(organization) {
            if Some(existing.as_str()) != current {
                return Err(RegistryError::Unauthorized);
            }
        } else if current.is_some() {
            return Err(RegistryError::Unauthorized);
        }
        self.authorities.insert(organization.into(), next.into());
        Ok(())
    }

    pub fn anchor(
        &mut self,
        caller: &str,
        organization: &str,
        subject: &str,
        document_hash: [u8; 32],
        sequence: u64,
    ) -> Result<Proof, RegistryError> {
        if self.authorities.get(organization).map(String::as_str) != Some(caller) {
            return Err(RegistryError::Unauthorized);
        }
        let key = (organization.to_owned(), subject.to_owned());
        if let Some(existing) = self.proofs.get(&key) {
            if existing.document_hash == document_hash && existing.sequence == sequence {
                return Ok(existing.clone());
            }
            return Err(RegistryError::SequenceConflict);
        }
        if sequence <= self.last_sequence.get(organization).copied().unwrap_or(0) {
            return Err(RegistryError::SequenceNotMonotonic);
        }
        self.last_sequence.insert(organization.into(), sequence);
        self.proofs.insert(
            key.clone(),
            Proof {
                organization: organization.into(),
                subject: subject.into(),
                document_hash,
                authority: caller.into(),
                sequence,
                revoked: false,
            },
        );
        Ok(self.proofs.get(&key).expect("proof inserted").clone())
    }

    pub fn revoke(
        &mut self,
        caller: &str,
        organization: &str,
        subject: &str,
    ) -> Result<(), RegistryError> {
        if self.authorities.get(organization).map(String::as_str) != Some(caller) {
            return Err(RegistryError::Unauthorized);
        }
        let proof = self
            .proofs
            .get_mut(&(organization.into(), subject.into()))
            .ok_or(RegistryError::NotFound)?;
        if proof.revoked {
            return Err(RegistryError::AlreadyRevoked);
        }
        proof.revoked = true;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn enforces_authority_and_monotonic_sequences() {
        let mut registry = Registry::default();
        registry.set_authority("org", None, "alice").unwrap();
        assert_eq!(
            registry.anchor("mallory", "org", "item-1", [1; 32], 1),
            Err(RegistryError::Unauthorized)
        );
        registry
            .anchor("alice", "org", "item-1", [1; 32], 1)
            .unwrap();
        assert_eq!(
            registry.anchor("alice", "org", "item-2", [2; 32], 1),
            Err(RegistryError::SequenceNotMonotonic)
        );
    }
    #[test]
    fn replays_exact_anchors_and_rejects_conflicts() {
        let mut registry = Registry::default();
        registry.set_authority("org", None, "alice").unwrap();
        assert_eq!(
            registry
                .anchor("alice", "org", "item-1", [1; 32], 1)
                .unwrap()
                .document_hash,
            [1; 32]
        );
        assert!(registry
            .anchor("alice", "org", "item-1", [1; 32], 1)
            .is_ok());
        assert_eq!(
            registry.anchor("alice", "org", "item-1", [2; 32], 1),
            Err(RegistryError::SequenceConflict)
        );
    }
    #[test]
    fn revocation_is_authorized_and_irreversible() {
        let mut registry = Registry::default();
        registry.set_authority("org", None, "alice").unwrap();
        registry
            .anchor("alice", "org", "item-1", [1; 32], 1)
            .unwrap();
        assert_eq!(
            registry.revoke("mallory", "org", "item-1"),
            Err(RegistryError::Unauthorized)
        );
        registry.revoke("alice", "org", "item-1").unwrap();
        assert_eq!(
            registry.revoke("alice", "org", "item-1"),
            Err(RegistryError::AlreadyRevoked)
        );
    }
}
