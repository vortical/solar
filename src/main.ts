import './style.css'

import { BodySystem, BodySystemOptionsState } from './scene/BodySystem.ts'
// import { DataService } from './data/bodySystems.ts';
import { NBodySystemUpdater } from './body/NBodySystemUpdater.ts';
import { Body} from './domain/Body.ts';

import { UIManager } from './ui.ts';

import LocationBar from './LocationBar.ts';
import { DataService } from './services/dataservice.ts';
import config from './configuration.ts';
import { BodiesAtTimeUpdater } from './body/BodiesAtTimeUpdater.ts';

console.log("starting....");


const mainElement = document.querySelector<HTMLDivElement>('#scene-container')!;
const datetimePickerElement = document.querySelector<HTMLInputElement>("#system-time")!;
const statusElement =document.querySelector<HTMLInputElement>("#status-container")!;

async function start(){

    const dataService = new DataService(config.spacefield_host)
    const bodySystemUpdater = new NBodySystemUpdater();
    const options = LocationBar.getState();
    const date = options.date ? new Date(options.date): new Date()

    const bodies: Body[] = await dataService.loadSolarSystem(date);
    const bodySystem = new BodySystem(mainElement, bodies, bodySystemUpdater, options);

    // set the up of the viewer to be perpendicular to earth's orbit
    const earth = bodySystem.getBody("earth");
    bodySystem.setCameraUp(earth.get_orbital_plane_normal());


    const ui = new UIManager(mainElement, datetimePickerElement, statusElement, bodySystem);

    ui.addDateTimeChangeListener( async (datetime) => {
        const kinematics = await dataService.loadKinematics(Array.from(bodySystem.bodyObjects3D.keys()), datetime);
        bodySystem.addUpdater(new BodiesAtTimeUpdater(kinematics,  datetime));
    })

    bodySystem.start();
}

try {
    start();
}catch(err) {
    console.error("Could not start application:"+ err.message)
};

    
    