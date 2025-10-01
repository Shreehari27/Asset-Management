import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from './sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';
import { MenuFoldOutline, MenuUnfoldOutline } from '@ant-design/icons-angular/icons';

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
export class Layout {
  collapsed = false;

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}
