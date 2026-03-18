import { DataTableSkeleton } from "@/components/ui/skeleton";

export default function FormationsLoading() {
  return (
    <div className="p-6">
      <DataTableSkeleton columns={4} rows={8} />
    </div>
  );
}
