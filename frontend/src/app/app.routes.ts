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

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout, // ✅ Always render sidebar + content
    children: [
      { path: '', component: Dashboard },

      // Assets
      { path: 'assets', component: AssetList },
      { path: 'assets/add', component: AddAsset },
      { path: 'assets/edit/:id', component: EditAsset },
      { path: 'assets/modify/:assetCode', component: AssetModificationComponent },
      { path: 'assignments/scrap', component: ScrapAsset },


      // Employees
      { path: 'employees', component: EmployeeListComponent },
      { path: 'employees/add', component: AddEmployee },
      { path: 'employees/edit/:id', component: EditEmployee },

      // Assignments
      { path: 'assignments/live', component: Live },
      { path: 'assignments/history', component: History },
      { path: 'assignments/assign', component: AssignAsset },
      {path: 'employees/:emp_code/assignments', component: EmployeeAssignments }
    ]
  },
  { path: '**', redirectTo: '' }
];
