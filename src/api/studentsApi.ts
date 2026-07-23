import { api } from './index';
import type { Student, StudentInput, StudentMutationResponse } from '../types/student';
import type { Paginated, PageParams } from '../types/api';
import { accumulatePages } from './accumulatePages';

export const studentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listStudents: builder.query<Paginated<Student>, PageParams>({
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: '/students',
        params: { page, pageSize },
      }),
      ...accumulatePages<Student>((student) => student.id),
      providesTags: (result) => [
        ...(result?.items ?? []).map(({ id }) => ({ type: 'Student' as const, id })),
        { type: 'Student' as const, id: 'LIST' },
      ],
    }),

    getStudent: builder.query<Student, number>({
      query: (id) => `/students/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Student', id }],
    }),

    createStudent: builder.mutation<StudentMutationResponse, StudentInput>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),

    updateStudent: builder.mutation<StudentMutationResponse, { id: number; body: StudentInput }>({
      query: ({ id, body }) => ({ url: `/students/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Student', id },
        { type: 'Student', id: 'LIST' },
      ],
    }),

    deleteStudent: builder.mutation<{ message: string }, number>({
      query: (id) => ({ url: `/students/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Student', id },
        { type: 'Student', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi;
