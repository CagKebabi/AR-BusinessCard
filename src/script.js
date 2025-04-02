// /* BÖLÜM 2 ımage tracking */
import * as THREE from 'three';
import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/Addons.js';
import glbModel from './assets/businnesCard/model_sunum_anim.glb?url';
import previewVideo from './assets/businnesCard/technoSoftWebsitePreviewCorped2.mp4'
import fbxModelAudio from './assets/businnesCard/businessCardSpeech.mp3?url';
import floorModelGlb from './assets/catalog/smart_home_interior_floor_plan.glb?url';
import floorModelGlb2 from './assets/catalog/3d_view_office_floor_plan_virtual_reality.glb?url';
import floorModelGlb3 from './assets/catalog/youtube_button.glb?url';
import targetMind from './assets/businnesCard/targetcanvadesign.mind?url';

console.log(THREE);

document.addEventListener('DOMContentLoaded', () => {
    const start = async () => { 
        try {
            // Kamera API'sinin varlığını kontrol et
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Tarayıcınız kamera erişimini desteklemiyor. Lütfen modern bir tarayıcı kullanın (Chrome, Firefox, Safari gibi)');
            }

            // HTTPS kontrolü - yerel ağ için özel durum
            const isLocalNetwork = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
            if (location.protocol !== 'https:' && !isLocalNetwork) {
                throw new Error('Kamera erişimi için HTTPS gereklidir. Lütfen sayfayı HTTPS üzerinden açın.');
            }

            // Kamera erişimi iste
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());

            const mindarThree = new MindARThree({
                container: document.body,
                imageTargetSrc: targetMind,
                filterMinCF: 0.001,
                filterBeta: 0.01,
            });
    
            const { renderer, scene, camera } = mindarThree;

            // Renderer ayarları
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1;

            // Işıkları ekle
            const ambientLight = new THREE.AmbientLight(0xffffff, 2);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
            directionalLight.position.set(0, 1, 1);
            scene.add(directionalLight);

            // Video Player oluştur
            const video = document.createElement('video');
            video.src = previewVideo; // Video dosyanızın yolunu buraya ekleyin
            video.loop = true;
            video.muted = true;
            video.playsInline = true;

            // Video texture oluştur
            const videoTexture = new THREE.VideoTexture(video);
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            videoTexture.format = THREE.RGBFormat;

            // Video için plane geometrisi oluştur
            const videoGeometry = new THREE.PlaneGeometry(1, 0.5625, 32, 32); // 16:9 aspect ratio with segments
            const videoMaterial = new THREE.MeshBasicMaterial({ 
                map: videoTexture,
                side: THREE.DoubleSide
            });
            const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);

            // Arka plan plane geometrisi oluştur
            // const bgGeometry = new THREE.PlaneGeometry(1.1, 0.6625, 100, 100); // Biraz daha büyük boyut
            // RoundedRectangle şekli oluşturmak için
            function createRoundedRectangleWithDepth(width, height, radius, depth) {
                const shape = new THREE.Shape();
                
                const x = -width/2;
                const y = -height/2;
                
                shape.moveTo(x, y + radius);
                shape.lineTo(x, y + height - radius);
                shape.quadraticCurveTo(x, y + height, x + radius, y + height);
                shape.lineTo(x + width - radius, y + height);
                shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
                shape.lineTo(x + width, y + radius);
                shape.quadraticCurveTo(x + width, y, x + width - radius, y);
                shape.lineTo(x + radius, y);
                shape.quadraticCurveTo(x, y, x, y + radius);
                
                const extrudeSettings = {
                  steps: 1,
                  depth: depth,
                  bevelEnabled: true,
                  bevelThickness: 0.01,
                  bevelSize: 0.01,
                  bevelOffset: 0,
                  bevelSegments: 5
                };

                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                return geometry;
            }
              
            // Kullanımı
            const bgGeometry = createRoundedRectangleWithDepth(1.1, 0.6625, 0.05, 0.001); // 0.1 derinlik değeri              
            const bgMaterial = new THREE.MeshBasicMaterial({
                color: 0x1b2a47,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
            bgMesh.position.set(0, 0, -0.03); // Video mesh'in hemen arkasına yerleştir

            // GLB model yükleyici ve animasyon
            let model_mixer;
            const loader = new GLTFLoader();
            const model = await loader.loadAsync(glbModel);
            
            // Audio yükleyici
            const audioElement = new Audio(fbxModelAudio);
            let animationTimeout;
            let hasInteracted = false;

            // iOS için ses kilidini açma fonksiyonu
            const unlockAudio = async () => {
                try {
                    await audioElement.play();
                    audioElement.pause();
                    audioElement.currentTime = 0;
                    hasInteracted = true;
                    document.getElementById('touchToScreen').style.display = 'none';
                    document.removeEventListener('touchstart', unlockAudio);
                    document.removeEventListener('click', unlockAudio);
                } catch (error) {
                    console.log('Audio unlock failed:', error);
                }
            };

            // Kullanıcı etkileşimi için event listener'lar
            document.addEventListener('touchstart', unlockAudio);
            document.addEventListener('click', unlockAudio);

            // Scale and position adjustments for the GLB model
            model.scene.scale.set(0.5, 0.5, 0.5);
            model.scene.position.set(-0.4, 0, 0);
            model.scene.rotation.x = Math.PI/2;
            model.scene.rotation.y = 1;

            // Setup animation mixer
            model_mixer = new THREE.AnimationMixer(model.scene);
            const modelAction = model_mixer.clipAction(model.animations[0]);
            modelAction.play();

            // Video player'ı konumlandır
            videoMesh.position.set(0, 0.7, 0);
            videoMesh.rotation.x = 1;

            // Modelleri anchor'a ekle
            const anchor = mindarThree.addAnchor(0);
            anchor.group.add(model.scene);
            videoMesh.add(bgMesh);
            anchor.group.add(videoMesh);

            // Target görünür olduğunda ve kaybolduğunda
            anchor.onTargetFound = () => {
                if (hasInteracted) {
                    audioElement.play().catch(error => {
                        console.log('Audio playback failed:', error);
                    });
                }
                modelAction.play();
                video.play();
                document.getElementById('videoControlsContainer').style.display = 'flex';
                // 31 saniye sonra animasyonu durdur
                animationTimeout = setTimeout(() => {
                    modelAction.paused = true;
                }, 31000);
            };

            anchor.onTargetLost = () => {
                if (hasInteracted) {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                }
                modelAction.stop();
                video.pause();
                document.getElementById('videoControlsContainer').style.display = 'none';
                // Timeout'u temizle
                if (animationTimeout) {
                    clearTimeout(animationTimeout);
                }
            };

            // Video kontrollerini oluştur
            // const controls = document.createElement('div');
            // controls.style.position = 'fixed';
            // controls.style.bottom = '20px';
            // controls.style.left = '20px';
            // controls.style.zIndex = '1000';
            // controls.innerHTML = `
            //     <button id="playPause">Play</button>
            //     <div>
            //         <label>Rotation X: <input type="range" id="rotationX" min="-180" max="180" value="90"></label>
            //         <label>Rotation Y: <input type="range" id="rotationY" min="-180" max="180" value="0"></label>
            //         <label>Rotation Z: <input type="range" id="rotationZ" min="-180" max="180" value="0"></label>
            //     </div>
            //     <div>
            //         <label>Position X: <input type="range" id="positionX" min="-2" max="2" value="0.7" step="0.1"></label>
            //         <label>Position Y: <input type="range" id="positionY" min="-2" max="2" value="0" step="0.1"></label>
            //         <label>Position Z: <input type="range" id="positionZ" min="-2" max="2" value="0" step="0.1"></label>
            //     </div>
            //     <div>
            //         <label>Scale: <input type="range" id="scale" min="0.1" max="2" value="1" step="0.1"></label>
            //     </div>
            // `;
            // document.body.appendChild(controls);

            // Kontrol olaylarını dinle
            // document.getElementById('playPause').addEventListener('click', () => {
            //     if (video.paused) {
            //         video.play();
            //         document.getElementById('playPause').textContent = 'Pause';
            //     } else {
            //         video.pause();
            //         document.getElementById('playPause').textContent = 'Play';
            //     }
            // });

            // Rotasyon kontrollerini dinle
            ['X', 'Y', 'Z'].forEach(axis => {
                document.getElementById(`rotation${axis}`).addEventListener('input', (e) => {
                    videoMesh.rotation[axis.toLowerCase()] = (parseInt(e.target.value) * Math.PI) / 180;
                });
            });

            // Pozisyon kontrollerini dinle
            ['X', 'Y', 'Z'].forEach(axis => {
                document.getElementById(`position${axis}`).addEventListener('input', (e) => {
                    videoMesh.position[axis.toLowerCase()] = parseFloat(e.target.value);
                });
            });

            // Ölçek kontrolünü dinle
            document.getElementById('scale').addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                videoMesh.scale.set(scale, scale, scale);
            });

            // Animation loop
            const clock = new THREE.Clock();
            await mindarThree.start();
            renderer.setAnimationLoop(() => {
                const delta = clock.getDelta();
                
                // Animasyon güncelleme
                if (model_mixer) {
                    model_mixer.update(delta);
                }
                renderer.render(scene, camera);
            });
        } catch (error) {
            console.error('Hata:', error);
            alert('Bir hata oluştu: ' + error.message);
        }
    };
    start();
});