import { Routes } from '@angular/router';
import { Calendar } from './dashboard/routeContent/calendar/calendar';
import { Categories } from './categories/categories';
import { Tasks } from './dashboard/routeContent/tasks/tasks';
import { Reminder } from './reminder/reminder';
import { authGuard } from './auth-guard';
import { Profiles } from './dashboard/profiles/profiles';

export const routes: Routes = [

    {
        path:'profiles',
        component:Profiles
    },
    {
        path:'home',
        component:Calendar,
        canActivate: [authGuard]
    },
    {
        path:'tasks',
        component:Tasks,
        canActivate: [authGuard]
    },
    {
        path:'reminder',
        component:Reminder,
        canActivate: [authGuard]
    },
    {
        path:'categories',
        component:Categories,
        canActivate: [authGuard]
    },
    {
        path:'',
        redirectTo:'profiles',
        pathMatch:'full'
    },
    { 
        path: '**', 
        redirectTo: 'profiles' 
    }
];
