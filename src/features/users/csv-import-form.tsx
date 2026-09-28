"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { importCsvAction, previewCsvAction } from "@/app/actions/scheduling";
import type { CsvRowIssue, CsvValidatedRow } from "@/lib/admin/csv-import";

export function CsvImportForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{
    valid: CsvValidatedRow[];
    issues: CsvRowIssue[];
    parseError?: string;
  } | null>(null);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvText(text);
      startTransition(async () => {
        const result = await previewCsvAction(text);
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        setPreview(result as { valid: CsvValidatedRow[]; issues: CsvRowIssue[]; parseError?: string });
      });
    };
    reader.readAsText(file);
  }

  const blocking = preview?.issues.some((issue) => issue.severity === "error") || Boolean(preview?.parseError);
  const creatable = preview?.valid.filter((row) => row.action === "create").length ?? 0;

  function confirmImport() {
    startTransition(async () => {
      const result = await importCsvAction(csvText);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if ("parseError" in result && result.parseError) {
        toast.error(result.parseError);
        return;
      }
      if ("created" in result) {
        toast.success(`Imported ${result.created} user(s). ${result.skipped} unchanged.`);
      }
      setOpen(false);
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Import CSV
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import roster CSV</DialogTitle>
            <DialogDescription>
              Columns required: name,email,role,team. Existing emails are flagged instead of being
              overwritten.
            </DialogDescription>
          </DialogHeader>
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="CSV file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
            }}
          />
          {preview?.parseError && (
            <p className="text-sm text-red-700" role="alert">
              {preview.parseError}
            </p>
          )}
          {preview && !preview.parseError && (
            <div className="max-h-72 space-y-3 overflow-y-auto text-sm">
              <p>
                Ready to create: {creatable}. Unchanged duplicates:{" "}
                {preview.valid.filter((row) => row.action === "skip").length}.
              </p>
              {preview.issues.length > 0 && (
                <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3">
                  {preview.issues.map((issue) => (
                    <li key={`${issue.line}-${issue.email}`}>
                      Line {issue.line}
                      {issue.email ? ` (${issue.email})` : ""}: {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmImport} disabled={pending || !preview || blocking || creatable === 0}>
              Confirm import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
