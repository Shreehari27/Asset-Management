import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { MenuFoldOutline, MenuUnfoldOutline } from '@ant-design/icons-angular/icons';

import { NZ_ICONS } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NzLayoutModule, NzMenuModule, NzIconModule, NzButtonModule, NzAvatarModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  providers: [
    { provide: NZ_ICONS, useValue: [MenuFoldOutline, MenuUnfoldOutline] }
  ]
})
export class App {
  isCollapsed = false;

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
