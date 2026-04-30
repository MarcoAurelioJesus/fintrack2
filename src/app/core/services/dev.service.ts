import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DevService {
  private apiUrl = '/api/dev';

  constructor(private http: HttpClient) {}

  /**
   * Limpa o banco de dados removendo todas as categorias e transações
   */
  clearDatabase(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/clear`,
      {}
    );
  }

  /**
   * Popula o banco de dados com dados de demonstração
   */
  seedDatabase(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/seed`,
      {}
    );
  }
}
