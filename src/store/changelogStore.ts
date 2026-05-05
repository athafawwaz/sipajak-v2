export const APP_VERSION = "2.2.0";

export interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  description: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.2.0",
    date: "2026-05-05",
    type: "minor",
    description: "Remove PDF upload for Finance approval, refactor DB schema to separate Subsidi/Non-Subsidi tables, and add new dummy data."
  },
  {
    version: "2.1.1",
    date: "2026-05-05",
    type: "patch",
    description: "Update git_guidelines.md with auto-push trigger rule"
  },
  {
    version: "2.1.0",
    date: "2026-05-05",
    type: "minor",
    description: "Add version changelog modal, Git guidelines docs, and refactor auth to use masterUserStore as single source of truth"
  },
  {
    version: "2.0.3",
    date: "2026-05-05",
    type: "patch",
    description: "Fix VP approval — update assigned VP badge & name to match Dept TI, auto-assign VP on submit by unit kerja"
  },
  {
    version: "2.0.2",
    date: "2026-05-05",
    type: "patch",
    description: "Fix Draft status on detail modal — add Kirim Pengajuan action button for requester"
  },
  {
    version: "2.0.1",
    date: "2026-05-05",
    type: "patch",
    description: "Update VP user data to Cipta Atsahlantusay — Dept TI for end-to-end approval flow testing"
  },
  {
    version: "2.0.0",
    date: "2026-05-01",
    type: "major",
    description: "Initial release of SI PAJAK v2 — Sistem Informasi Pajak PT. Pupuk Sriwidjaja Palembang"
  },
];
