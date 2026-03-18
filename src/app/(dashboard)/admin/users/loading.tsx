import { DataTableSkeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="p-6">
      <DataTableSkeleton columns={5} rows={8} />
    </div>
  );
}
