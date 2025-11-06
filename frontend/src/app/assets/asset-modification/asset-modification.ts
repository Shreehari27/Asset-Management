import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../../environments/environment';
import { EmployeeService, Employee } from '../../services/employee';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-asset-modification',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './asset-modification.html',
  styleUrls: ['./asset-modification.css']
})
export class AssetModificationComponent implements OnInit, OnDestroy {
  assetCode!: string;
  modifications: any[] = [];
  employees: Employee[] = [];
  modForm!: FormGroup;
  private routeSub!: Subscription;

  private baseUrl = `${environment.baseUrl}/assets`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private empService: EmployeeService,
    private route: ActivatedRoute,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.assetCode = params['assetCode'];
      this.loadITEmployees();
      this.loadModifications();
      this.initForm();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  initForm() {
    const user = this.authService.getUser();
    const empCode = user?.emp_code;

    this.modForm = this.fb.group({
      modification_date: [new Date(), Validators.required],
      modified_by: [{ value: empCode, disabled: true }, Validators.required], // ✅ Auto-fill & lock
      modification: ['', Validators.required]
    });
  }

  loadITEmployees() {
    this.empService.getEmployees().subscribe({
      next: (data: Employee[]) => {
        this.employees = data.filter((emp: Employee) => emp.isIT && emp.status === 'active');
      },
      error: (err: any) => console.error('❌ Failed to load employees', err)
    });
  }

  loadModifications() {
    this.http.get<any[]>(`${this.baseUrl}/modifications/${this.assetCode}`).subscribe({ // ✅ GET aligned with route
      next: (data: any[]) => (this.modifications = data),
      error: (err: any) => console.error('❌ Failed to load modifications', err)
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const month = ('' + (d.getMonth() + 1)).padStart(2, '0');
    const day = ('' + d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  submitModification() {
    if (this.modForm.invalid) return;

    const payload = {
      asset_code: this.assetCode,
      modified_by: this.modForm.value.modified_by,
      modification: this.modForm.value.modification,
      modification_date: this.formatDate(this.modForm.value.modification_date)
    };

    this.http.post(`${this.baseUrl}/modify`, payload).subscribe({ // ✅ POST aligned with route
      next: () => {
        this.modForm.reset({ modification_date: new Date() });
        this.loadModifications();
      },
      error: (err: any) => console.error('❌ Failed to log modification', err)
    });
  }
}
