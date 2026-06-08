import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';

export interface Research {
  id?: number;
  title?: string;
  summary?: string;
  fileUrl?: string;
  categoryId?: number;
  publishedAt?: string;
  isActive?: boolean;
}

export interface Exam {
  id?: number;
  title?: string;
  description?: string;
  date?: string;
  fileUrl?: string;
  categoryId?: number;
  isActive?: boolean;
}

export interface Book {
  id?: number;
  title?: string;
  author?: string;
  editorial?: string;
  year?: number;
  fileUrl?: string;
  categoryId?: number;
  isActive?: boolean;
}

export interface LibraryCategory {
  id?: number;
  name?: string;
  isActive?: boolean;
}

export interface BookRequest {
  id?: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  bookId?: number;
  bookTitle?: string;
  bookAuthor?: string;
  bookFileUrl?: string;
  requestedAt?: string;
  status?: string;
  sentAt?: string;
  sentByUserName?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly baseUrl = `/api/v1`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Research
  getResearch(): Observable<Research[]> {
    return this.http.get<Research[]>(`${this.baseUrl}/public/research`);
  }

  createResearch(payload: Research): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/admin/research`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  updateResearch(id: number, payload: Research): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/admin/research/${id}`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  removeResearch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/research/${id}`, {
      headers: this.authHeaders(),
    });
  }

  getResearchCategories(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/admin/research-categories`, {
      headers: this.authHeaders(),
      params: this.noCacheParams(),
    });
  }

  createResearchCategory(payload: LibraryCategory): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/admin/research-categories`, payload, {
      headers: this.authHeaders(),
    });
  }

  updateResearchCategory(id: number, payload: LibraryCategory): Observable<unknown> {
    return this.http.put<unknown>(`${this.baseUrl}/admin/research-categories/${id}`, payload, {
      headers: this.authHeaders(),
    });
  }

  removeResearchCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/research-categories/${id}`, {
      headers: this.authHeaders(),
    });
  }

  // Exams
  getExams(): Observable<Exam[]> {
    return this.http.get<Exam[]>(`${this.baseUrl}/public/exams`);
  }

  createExam(payload: Exam): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/admin/exams`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  updateExam(id: number, payload: Exam): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/admin/exams/${id}`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  removeExam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/exams/${id}`, {
      headers: this.authHeaders(),
    });
  }

  getExamCategories(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/admin/exam-categories`, {
      headers: this.authHeaders(),
      params: this.noCacheParams(),
    });
  }

  createExamCategory(payload: LibraryCategory): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/admin/exam-categories`, payload, {
      headers: this.authHeaders(),
    });
  }

  updateExamCategory(id: number, payload: LibraryCategory): Observable<unknown> {
    return this.http.put<unknown>(`${this.baseUrl}/admin/exam-categories/${id}`, payload, {
      headers: this.authHeaders(),
    });
  }

  removeExamCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/exam-categories/${id}`, {
      headers: this.authHeaders(),
    });
  }

  // Books
  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.baseUrl}/public/books`);
  }

  createBook(payload: Book): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/admin/books`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  updateBook(id: number, payload: Book): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/admin/books/${id}`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  removeBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/books/${id}`, {
      headers: this.authHeaders(),
    });
  }

  getBookCategories(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/admin/book-categories`, {
      headers: this.authHeaders(),
      params: this.noCacheParams(),
    });
  }

  private noCacheParams(): HttpParams {
    return new HttpParams().set('_ts', Date.now().toString());
  }

  createBookCategory(payload: LibraryCategory): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/admin/book-categories`, payload, {
      headers: this.authHeaders(),
    });
  }

  updateBookCategory(id: number, payload: LibraryCategory): Observable<unknown> {
    return this.http.put<unknown>(`${this.baseUrl}/admin/book-categories/${id}`, payload, {
      headers: this.authHeaders(),
    });
  }

  removeBookCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/book-categories/${id}`, {
      headers: this.authHeaders(),
    });
  }

  uploadResearchFile(file: File): Observable<unknown> {
    return this.uploadWithFallback(file, [
      `${this.baseUrl}/admin/research/upload-file`,
      `${this.baseUrl}/admin/research/upload-document`,
      `${this.baseUrl}/admin/research/upload`,
    ]);
  }

  uploadExamFile(file: File): Observable<unknown> {
    return this.uploadWithFallback(file, [
      `${this.baseUrl}/admin/exams/upload-file`,
      `${this.baseUrl}/admin/exams/upload-document`,
      `${this.baseUrl}/admin/exams/upload`,
    ]);
  }

  createBookRequest(payload: { bookId: number }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/book-requests`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  getMyBookRequests(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/my-book-requests`, {
      headers: this.authHeaders(),
      params: this.noCacheParams(),
    });
  }

  getAdminBookRequests(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/admin/book-requests`, {
      headers: this.authHeaders(),
      params: this.noCacheParams(),
    });
  }

  sendBookRequest(id: number, payload: { notes?: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/admin/book-requests/${id}/send`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  rejectBookRequest(id: number, payload: { notes?: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/admin/book-requests/${id}/reject`, payload, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(map((response) => this.parseTextResponse(response)));
  }

  private uploadWithFallback(file: File, endpoints: string[], index = 0): Observable<unknown> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(endpoints[index], formData, {
      headers: this.authHeaders(),
      responseType: 'text',
    }).pipe(
      map((response) => this.parseTextResponse(response)),
      catchError((error: unknown) => {
        if (this.shouldTryNextUploadEndpoint(error) && index < endpoints.length - 1) {
          return this.uploadWithFallback(file, endpoints, index + 1);
        }
        return throwError(() => error);
      }),
    );
  }

  private shouldTryNextUploadEndpoint(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    return error.status === 404 || error.status === 405;
  }

  private parseTextResponse(response: string): unknown {
    const trimmed = response.trim();
    if (!trimmed) {
      return '';
    }

    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return trimmed;
    }
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
