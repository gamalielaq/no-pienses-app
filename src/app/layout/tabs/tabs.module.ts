import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { TabsRoutingModule } from './tabs-routing.module';

@NgModule({
    imports: [CommonModule, IonicModule, TabsRoutingModule],
})
export class TabsModule {}
