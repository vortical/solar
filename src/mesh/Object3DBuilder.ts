import { Body } from "../body/Body.ts";
import { BodyObject3D } from "./BodyObject3D";
import { StarBodyObject3D } from "./StarBodyObject3D";
import { PlanetaryBodyObject3D } from "./PlanetBodyObject3D";
import { MoonBodyObject3D } from "./MoonBodyObject3D.ts";
import { BodySystem } from "../scene/BodySystem.ts";
// import { ModelBodyObject3D } from "./ModelBodyObject3D.ts";

export const BodyObject3DFactory = {
    create: (body: Body, bodySystem: BodySystem): BodyObject3D => {
        switch (body.type) {
            // case "model":
            //     return new ModelBodyObject3D(body, bodySystem);
            case "star":
                return new StarBodyObject3D(body, bodySystem);
            case "planet":
                return new PlanetaryBodyObject3D(body, bodySystem);
            case "moon":
                return new MoonBodyObject3D(body, bodySystem);

            default:
                throw new Error("Invalid body type: " + body.type);
        }
    }
}


