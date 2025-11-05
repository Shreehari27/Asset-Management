import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from './sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';
import { MenuFoldOutline, MenuUnfoldOutline } from '@ant-design/icons-angular/icons';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterOutlet, NzIconModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
  providers: [
    { provide: NZ_ICONS, useValue: [MenuFoldOutline, MenuUnfoldOutline] },
  ],
})
export class Layout implements OnInit {
  collapsed = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}
