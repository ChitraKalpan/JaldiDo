export class TransferService {
  getUploadUrl(sessionId: string): string {
    return `/api/sessions/${sessionId}/files`;
  }

  getDownloadUrl(sessionId: string, fileId: string): string {
    return `/api/sessions/${sessionId}/files/${fileId}`;
  }
}
