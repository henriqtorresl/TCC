import { notFound } from "next/navigation";
import { AttendanceDetailsScreen } from "@/components/attendances/attendance-details-screen";

type AttendanceDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AttendanceDetailsPage({
  params,
}: AttendanceDetailsPageProps) {
  const { id } = await params;
  const attendanceId = Number(id);

  if (!Number.isFinite(attendanceId) || attendanceId <= 0) {
    notFound();
  }

  return <AttendanceDetailsScreen attendanceId={attendanceId} />;
}
