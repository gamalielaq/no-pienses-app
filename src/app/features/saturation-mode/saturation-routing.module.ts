import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SaturationPage } from './pages/saturation.page';

const routes: Routes = [
    {
        path: '',
        component: SaturationPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SaturationRoutingModule {}
