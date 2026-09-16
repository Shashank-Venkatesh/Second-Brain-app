export {}

declare global {
  interface Window {
    desktop?: {
      platform: string
      selectFolder: () => Promise<string | null>
      authenticateGmail: () => Promise<{ connected: boolean }>
      syncGmailDomain: (domain: string, folderPath: string) => Promise<{
        imported: number
        skipped: number
        total: number
        items: { subject: string; fileName: string; isNew: boolean }[]
      }>
    }
  }
}