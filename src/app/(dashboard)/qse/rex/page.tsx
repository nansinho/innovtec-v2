import { getRexList } from "@/actions/qse";
import { getAllUsers } from "@/actions/users";
import RexPageClient from "./page-client";


export default async function RexPage() {
  const [rexList, allUsers] = await Promise.all([getRexList(), getAllUsers()]);
  const profiles = allUsers
    .filter((u) => u.is_active)
    .map((u) => ({ id: u.id, first_name: u.first_name, last_name: u.last_name }));

  return <RexPageClient rexList={rexList} profiles={profiles} />;
}
