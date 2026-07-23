import { Binary, MongoClient, ObjectId } from "mongodb";
import type { CertificateStore } from "./service.js";
export class MongoCertificateStore implements CertificateStore {
  private client: MongoClient;
  constructor(uri: string) {
    this.client = new MongoClient(uri);
  }
  async connect() {
    await this.client.connect();
    await this.client
      .db()
      .collection("certificate_documents")
      .createIndex(
        { organizationId: 1, itemId: 1, contentHash: 1 },
        { unique: true },
      );
  }
  async put(input: Parameters<CertificateStore["put"]>[0]) {
    const result = await this.client
      .db()
      .collection("certificate_documents")
      .insertOne({
        ...input,
        content: new Binary(input.content),
        quarantined: false,
        createdAt: new Date(),
      });
    return result.insertedId.toHexString();
  }
  async delete(id: string) {
    await this.client
      .db()
      .collection("certificate_documents")
      .deleteOne({ _id: new ObjectId(id) });
  }
}
