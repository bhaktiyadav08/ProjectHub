import TaskBoard from "../components/TaskBoard";
import { useParams } from "react-router-dom";

function AdminGroupManage() {
  const { groupId } = useParams();

  // Keep the selected group ID available to TaskBoard
  if (groupId) {
    localStorage.setItem("currentGroupId", groupId);
  }

  return <TaskBoard role="admin" />;
}

export default AdminGroupManage;