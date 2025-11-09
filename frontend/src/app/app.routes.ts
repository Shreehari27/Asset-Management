import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Dashboard } from './dashboard/dashboard';
import { EmployeeListComponent } from './employees/employee-list/employee-list';
import { AssetList } from './assets/asset-list/asset-list';
import { Live } from './assignments/live/live';
import { History } from './assignments/history/history';
import { AddEmployee } from './employees/add-employee/add-employee';
import { EditEmployee } from './employees/edit-employee/edit-employee';
import { AddAsset } from './assets/add-asset/add-asset';
import { EditAsset } from './assets/edit-asset/edit-asset';
import { AssignAsset } from './assignments/assign-asset/assign-asset';
import { ScrapAsset } from './assets/scrap-asset/scrap-asset';
import { AssetModificationComponent } from './assets/asset-modification/asset-modification';
import { Login } from './login/login';
import { EmployeeAssignments } from './employees/employee-assignments/employee-assignments';
import { ForgotPassword } from './forgot-password/forgot-password';
import { Signup } from './sign-up/sign-up';
import { authGuard } from './auth.guard';
import { itGuard } from './it.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'signup', component: Signup },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      // Dashboard (IT + Manager only)
      { path: '', component: Dashboard, canActivate: [itGuard] },

      // Assets
      { path: 'assets', component: AssetList, canActivate: [itGuard] },
      { path: 'assets/add', component: AddAsset, canActivate: [itGuard] },
      { path: 'assets/edit/:id', component: EditAsset, canActivate: [itGuard] },
      { path: 'assets/modify/:assetCode', component: AssetModificationComponent, canActivate: [itGuard] },
      { path: 'assignments/scrap', component: ScrapAsset, canActivate: [itGuard] },

      // Employees
      { path: 'employees', component: EmployeeListComponent, canActivate: [itGuard] },
      { path: 'employees/add', component: AddEmployee, canActivate: [itGuard] },
      { path: 'employees/edit/:id', component: EditEmployee, canActivate: [itGuard] },

      // Assignments (accessible by all roles)
      { path: 'assignments/live', component: Live },
      { path: 'assignments/history', component: History },
      { path: 'assignments/assign', component: AssignAsset, canActivate: [itGuard] },
      { path: 'employees/:emp_code/assignments', component: EmployeeAssignments }
    ]
  },

  { path: '**', redirectTo: '' }
];
