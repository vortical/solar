import { Body } from '../domain/Body.ts';
import { meshProperties } from "../data/bodySystems.ts";
import { Mesh, Material, TextureLoader, SphereGeometry, MeshPhongMaterialParameters, MeshPhongMaterial, Object3D, RingGeometry, MeshLambertMaterial, DoubleSide, Vector3, Quaternion, IcosahedronGeometry } from "three";
import { SCENE_LENGTH_UNIT_FACTOR } from '../system/units.ts';
import { BodyObject3D } from './BodyObject3D.ts';
import { MaterialProperties } from '../domain/models.ts';


const textureLoader = new TextureLoader();

function createAtmosphereMateriel(textureUri: string) {
    return new MeshPhongMaterial({
        map: textureLoader.load(textureUri),
        transparent: true,
        opacity: 0.9
    })
}

function createBodySurfaceMaterial(materialProperties: MaterialProperties): Material {
    
    const params: MeshPhongMaterialParameters = {
        map: materialProperties.textureUri? textureLoader.load(materialProperties.textureUri) : undefined,
        normalMap: materialProperties.normalUri? textureLoader.load(materialProperties.normalUri) : undefined,
        bumpMap: materialProperties.bumpMapUri? textureLoader.load(materialProperties.bumpMapUri) : undefined,
        specularMap: materialProperties.specularMapUri? textureLoader.load(materialProperties.specularMapUri) : undefined,
        color: materialProperties.color 
    }

    const material = new MeshPhongMaterial(params);
    return material;
}


function   createRingMeshes(body: Body): Mesh[] | undefined {
    // todo: we support rings with parts with different rotational periods, but need to generate imagery for this.
    // https://astronomy.stackexchange.com/questions/25405/what-are-the-periods-of-saturns-rings
    // https://en.wikipedia.org/wiki/Rings_of_Saturn#Major_subdivisions

    /**
     * Map texture UV based on distance from center
     * 
     * @param mesh 
     * @param midpoint 
     * @returns 
     */
    function adjustTextureUV(mesh: Mesh, midpoint: number): Mesh {
        const positions = mesh.geometry.attributes.position;        
        let verticePosition = new Vector3();
        const angle = new Vector3(1,0,0);

        for (let i = 0; i < positions.count; i++){
            verticePosition.fromBufferAttribute(positions, i);
            const verticeAngle = verticePosition.angleTo(angle);
            const distanceFromCenter = verticePosition.fromBufferAttribute(positions, i).length();
            mesh.geometry.attributes.uv.setXY(i, Math.abs(distanceFromCenter) < midpoint ? 0 : 1, verticeAngle/Math.PI);
        }
        return mesh;
    }

    return body.rings?.map((r) => {
        const geometry = new RingGeometry(
            r.minRadius/1000,
            r.maxRadius/1000,
            128
          );

        const colorMap = textureLoader.load(r.colorMapUri!);
        const alphaMap = textureLoader.load(r.alphaMapUri!);
        const material = new MeshLambertMaterial({            
            map: colorMap,
            alphaMap: alphaMap,
            transparent: true,
            opacity: r.opacity,
            side: DoubleSide,
            wireframe: false
        });
      
        const mesh = new Mesh(geometry, material);
        return adjustTextureUV(mesh, (r.minRadius/1000 + r.maxRadius/1000)/2);
    });
 }


const createObject3D = (body: Body) => {
    const materialProperties = meshProperties.solarSystem.find((b) => b.name.toLocaleLowerCase() == body.name.toLowerCase())!;
    const widthSegements = 64;
    const heightSegments = 48;
    const geometry = new SphereGeometry(body.radius * SCENE_LENGTH_UNIT_FACTOR, widthSegements, heightSegments);
    const material = createBodySurfaceMaterial(materialProperties);
    const surfacemesh = new Mesh(geometry, material);

    if (materialProperties.atmosphereUri) {
        const altitude = 15; //  km
        const atmosphereMesh = new Mesh(
            new SphereGeometry(body.radius * SCENE_LENGTH_UNIT_FACTOR + altitude, widthSegements, heightSegments),
            createAtmosphereMateriel(materialProperties.atmosphereUri)
        );
        // hack hack...  todo: reference the body object 3D into 'parts', not just three.js 3d objects with user data to identify them.
        // e.g.: atmosphere, surface (roads etc...) 
        atmosphereMesh.userData = {type: "atmosphere"};
        surfacemesh.add(atmosphereMesh);
    }

    surfacemesh.name = body.name;
    const ringMeshes = createRingMeshes(body);
    const bodymesh = new Object3D();
    
    // TODO: put all this this logic in axis.direction
    if(body.axisDirection !== undefined){
        // rotate body so axis is normal to its orbital plane (i.e.: equatorial = orbital/ecliptic)
        const axis = body.axisDirection!;
        bodymesh.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(axis.x, axis.y, axis.z)));
    
    }else{
        // We tilt the body using the body's obliquity arbitrarily tilt the body using 
        const rotation =body.obliquityOrientation();
        bodymesh.applyQuaternion(rotation);
        const body_orbital_norm = body.get_orbital_plane_normal() || new Vector3(0,1,0);
        bodymesh.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), body_orbital_norm));
    }
    
    bodymesh.add(surfacemesh);
    ringMeshes?.forEach((ringMesh) => surfacemesh.add(ringMesh))
    ringMeshes?.forEach((ringMesh) => ringMesh.rotation.set(-Math.PI/2, 0, 0));
    return bodymesh;
}    

class PlanetaryBodyObject3D extends BodyObject3D {
    createObject3D(body: Body): Object3D{
        return createObject3D(body)
    }
}

export { PlanetaryBodyObject3D };