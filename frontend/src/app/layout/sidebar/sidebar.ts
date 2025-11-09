// sidebar.ts
import { Component, Input, OnInit } from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatCardModule, MatIconModule, MatRippleModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  animations: [
    trigger('sidebarToggle', [
      state('expanded', style({ width: '280px', opacity: 1 })),
      state('collapsed', style({ width: '72px', opacity: 0.95 })),
      transition('expanded <=> collapsed', [
        animate('250ms ease-in-out')
      ])
    ]),
    trigger('labelFade', [
      state('visible', style({ opacity: 1, transform: 'translateX(0)' })),
      state('hidden', style({ opacity: 0, transform: 'translateX(-10px)' })),
      transition('visible <=> hidden', [
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class Sidebar implements OnInit {
  @Input() collapsed: boolean = false; // passed from Layout
  role: string = '';

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.role = user?.role || '';
  }

  isIT(): boolean {
    return this.role === 'IT';
  }
  isManager(): boolean {
    return this.role === 'Manager';
  }
  isEmployee(): boolean {
    return this.role === 'Employee';
  }
}
