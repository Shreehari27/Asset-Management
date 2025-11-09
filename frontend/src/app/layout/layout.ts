import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from './sidebar/sidebar';
import { RouterOutlet, Router } from '@angular/router';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';
import { MenuFoldOutline, MenuUnfoldOutline } from '@ant-design/icons-angular/icons';
import { AuthService } from '../services/auth';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterOutlet, NzIconModule, MatSnackBarModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
  providers: [
    { provide: NZ_ICONS, useValue: [MenuFoldOutline, MenuUnfoldOutline] },
  ],
})
export class Layout implements OnInit {
  collapsed = false;
  user: any = null; //Store logged-in user info

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.user = this.authService.getUser(); // Retrieve user info from session
    }
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  logout() {
    this.authService.logout();
    this.snackBar.open('You have been logged out.', 'Close', { duration: 3000 });
    this.router.navigate(['/login']);
  }
}
