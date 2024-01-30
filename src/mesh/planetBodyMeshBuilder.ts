import { Body, MaterialProperties } from '../body/Body.ts';
import { meshProperties } from "../data/bodySystems.ts";
import { Mesh, Material, MeshPhysicalMaterial, TextureLoader, SphereGeometry, MeshPhongMaterialParameters, MeshPhongMaterial, Object3D, RingGeometry, MeshLambertMaterial, DoubleSide, Vector3, Euler } from "three";
import { Object3DBuilder } from "./Object3DBuilder.ts";
import { SCENE_LENGTH_UNIT_FACTOR } from '../system/units.ts';
// import { rotationForObliquityToOrbit } from '../system/geometry.ts';


const textureLoader = new TextureLoader();



function createRingMaterial(){

}

function createAtmosphereMateriel(textureUri: string) {

    // we could offer the option to  load cloud imagery generated from somewhere.
    // and we'd draw it on a canvas. This would be useful when animating in real time.

    const material = new MeshPhongMaterial({
        map: textureLoader.load(textureUri),
        transparent: true,
        opacity: 0.9
    })

    // const options = {
    //     transmission: 1.0,
    //     thickness: 0.1,
    //     roughness: 0.1,
    // };
    
    // const material = new MeshPhysicalMaterial({
    //     // map: textureLoader.load('https://clouds.matteason.co.uk/images/4096x2048/clouds.jpg'),
    //     // map: textureLoader.load('/assets/textures/planets/earth_clouds_2048.png'),
    //     map: textureLoader.load(textureUri),
    //     transmission: options.transmission,
    //     thickness: options.thickness,
    //     roughness: options.roughness,
    //     clearcoat: 1.0,
    //     clearcoatRoughness: 10.0,
    //     specularIntensity:0.0005,
    //     reflectivity: 1.0
    //     });

    return material;
}

function createBodySurfaceMaterial(materialProperties: MaterialProperties): Material {
    
    const params: MeshPhongMaterialParameters = {
        map: materialProperties.textureUri? textureLoader.load(materialProperties.textureUri) : undefined,
        normalMap: materialProperties.normalUri? textureLoader.load(materialProperties.normalUri) : undefined,
        bumpMap: materialProperties.bumpMapUri? textureLoader.load(materialProperties.bumpMapUri) : undefined,
        color: materialProperties.color 
    }

    const material = new MeshPhongMaterial(params);
    return material;
}

//https://planetpixelemporium.com/saturn.html
// ring patter for saturn

function   createRingMeshes(body: Body): Mesh[] | undefined {
    //todo: we can break rings down into parts with different rotational periods
    // https://astronomy.stackexchange.com/questions/25405/what-are-the-periods-of-saturns-rings
    //https://en.wikipedia.org/wiki/Rings_of_Saturn#Major_subdivisions

    // for another source of imagery: https://en.wikipedia.org/wiki/Rings_of_Saturn#/media/File:Saturn's_rings_dark_side_mosaic.jpg
//    return undefined;

    function adjustTextureUV(mesh: Mesh, midpoint: number): Mesh {

        const positions = mesh.geometry.attributes.position;        
        let verticePosition = new Vector3();

        // start at 0...
        const angle = new Vector3(1,0,0);

        // we do 360 degrees.

        for (let i = 0; i < positions.count; i++){
            
            verticePosition.fromBufferAttribute(positions, i);
            // what is the angle?
            const verticeAngle = verticePosition.angleTo(angle);

            // y pos on texture is: 
            // const rel = verticeAngle/Math.PI * 2

            const distanceFromCenter = verticePosition.fromBufferAttribute(positions, i).length();


            mesh.geometry.attributes.uv.setXY(i, Math.abs(distanceFromCenter) < midpoint ? 0 : 1, verticeAngle/Math.PI);
            
        }
        return mesh;
    }

    return body.rings?.map((r) => {
        //https://en.wikipedia.org/wiki/Rings_of_Saturn

        // for uv mapping:
        //https://codepen.io/prisoner849/pen/zYOgroW?editors=0010

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




const createObject3D: Object3DBuilder = (body: Body) => {

    const { name, radius, position } = body;

    const materialProperties = meshProperties.solarSystem.find((v) => v.name.toLocaleLowerCase() == name.toLowerCase())!;

    // could use LOD...
    const widthSegements = 64;
    const heightSegments = 32;

    const geometry = new SphereGeometry(radius * SCENE_LENGTH_UNIT_FACTOR, widthSegements, heightSegments);
    const material = createBodySurfaceMaterial(materialProperties);
    const surfacemesh = new Mesh(geometry, material);

    if (materialProperties.atmosphereUri) {
        const altitude = 15; //  km
        const atmosphereMesh = new Mesh(
            new SphereGeometry(radius * SCENE_LENGTH_UNIT_FACTOR + altitude, widthSegements, heightSegments),
            createAtmosphereMateriel(materialProperties.atmosphereUri)
        );
        surfacemesh.add(atmosphereMesh);
    }


    surfacemesh.name = name;

    const ringMeshes = createRingMeshes(body);
    
    const worldmesh = new Object3D();
    worldmesh.position.set(position.x * SCENE_LENGTH_UNIT_FACTOR, position.y * SCENE_LENGTH_UNIT_FACTOR, position.z * SCENE_LENGTH_UNIT_FACTOR);
    const rotation =body.obliquityOrientation();
    worldmesh.rotation.set(rotation.x, rotation.y, rotation.z); 
    worldmesh.add(surfacemesh);
    
    ringMeshes?.forEach((ringMesh) => surfacemesh.add(ringMesh))
    
    ringMeshes?.forEach((ringMesh) => ringMesh.rotation.set(-Math.PI/2, 0, 0));

    return worldmesh;
}    

export { createObject3D as createPlanetObject3D };