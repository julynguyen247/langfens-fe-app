import { apisCourse } from "../utils/api.customize";

export async function getCourses(opts?: { category?: string; level?: string; status?: string; page?: number; pageSize?: number }) {
  const res = await apisCourse.get("/getpublishedcourse/", {
    params: opts,
  });
  return res;
}

export async function getCourseBySlug(slug: string) {
  const res = await apisCourse.get(`/getbyslug/${slug}`);
  return res;
}

export async function getLessonsBySlug(slug: string) {
  const res = await apisCourse.get(`/getlessonbyslug/${slug}`);
  return res;
}

export async function getLessonById(lessonId: string) {
  const res = await apisCourse.get(`/lesson/${lessonId}`);
  return res;
}

export async function completeLesson(userId: string, lessonId: string) {
  const res = await apisCourse.post(`/${userId}/${lessonId}:complete`);
  return res;
}
