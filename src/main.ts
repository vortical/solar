import './style.css'

import { BodySystem, BodySystemOptionsState } from './scene/BodySystem.ts'
// import { DataService } from './data/bodySystems.ts';
import { NBodySystemUpdater } from './body/NBodySystemUpdater.ts';
import { Body} from './body/Body.ts';

import UI from './ui.ts';

import LocationBar from './LocationBar.ts';
import { DataService } from './services/dataservice.ts';
import config from './configuration.ts';

console.log("starting....");


const mainElement = document.querySelector<HTMLDivElement>('#scene-container')!;
const datetimePickerElement = document.querySelector<HTMLInputElement>("#system-time")!;
const statusElement =document.querySelector<HTMLInputElement>("#status-container")!;



// function getCurrentState(): object {

//     // var center = coordinateTransformation.getCenter();
//     // var eye = view.getEye();
//     // var target = view.getTarget();
//     // var verticalExaggeration = view.getVerticalExaggeration();

//     // var switchedOnGeologies = getSwitchedOnGeologies();
//     // return {
//     //   lat: Number( (center.lat * 180/Math.PI).toFixed(9)),
//     //   lon: Number( (center.lon * 180/Math.PI).toFixed(9)),
//     //   eye: eye.map(function(x){return Number( x.toFixed(0));}),
//     //   target: target.map(function(x){return Number(x.toFixed(0));}),


//     return {

//     };
// }

async function start(){

    const dataService = new DataService(config.spacefield_host)
    const bodySystemUpdater = new NBodySystemUpdater();
    const bodies: Body[] = await dataService.loadSolarSystem(new Date());

    const options = LocationBar.getState();
    const bodySystem = new BodySystem(mainElement, bodies, bodySystemUpdater, options);
    // set the up of the viewer to be perpendicular to earth's orbit
    const earth = bodySystem.getBody("earth");
    bodySystem.setCameraUp(earth.get_orbital_plane_normal());


    UI(mainElement, datetimePickerElement, statusElement, bodySystem);

    bodySystem.start();
}

try {
    start();
}catch(err) {
    console.error("Could not start application:"+ err.message)
};

    
    