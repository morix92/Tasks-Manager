import { Routes } from '@angular/router';
import { Calendar } from './dashboard/routeContent/calendar/calendar';
import { Categories } from './dashboard/routeContent/categories/categories';
import { Tasks } from './dashboard/routeContent/tasks/tasks';
import { Reminders } from './dashboard/routeContent/reminders/reminders';
import { authGuard } from './auth-guard';
import { Profiles } from './dashboard/profiles/profiles';
import { CreateTask } from './dashboard/routeContent/tasks/create-task/create-task';
import { FaqComponent } from './dashboard/routeContent/faq/faq';

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
        path:'addTask',
        component:CreateTask,
        canActivate: [authGuard]
    },
    {
        path:'tasks',
        component:Tasks,
        canActivate: [authGuard]
    },
    {
        path:'reminder',
        component:Reminders,
        canActivate: [authGuard]
    },
    {
        path:'categories',
        component:Categories,
        canActivate: [authGuard]
    },
    {
        path:'FAQ',
        component:FaqComponent,
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
