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
import targetMind from './assets/businnesCard/targetcanvadesign2.mind?url';

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

            // Platform (Cylinder)
            const platformGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
            const platformMaterial = new THREE.MeshBasicMaterial({
                color: 0x1b2a47,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
            platformMesh.scale.set(0.5, 0.5, 0.5);
            platformMesh.position.set(0.65, -0.32, 0.2);
            platformMesh.rotation.y = Math.PI/2;

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
            model.scene.position.set(0.65, -0.3, 0.2);
            model.scene.rotation.x = 0;
            model.scene.rotation.y = 0.2;

            // Setup animation mixer
            model_mixer = new THREE.AnimationMixer(model.scene);
            const modelAction = model_mixer.clipAction(model.animations[0]);
            modelAction.play();

            // Play/Pause button functionality
            const playButton = document.getElementById('playButton');
            let isPlaying = true;
            let timeoutStartTime = 0;
            let remainingTimeout = 31000;

            playButton.addEventListener('click', () => {
                if (isPlaying) {
                    // Pause everything
                    if (hasInteracted) {
                        audioElement.pause();
                    }
                    modelAction.paused = true;
                    video.pause();
                    playButton.classList.add('paused');
                    
                    // Calculate remaining timeout time
                    if (animationTimeout) {
                        clearTimeout(animationTimeout);
                        const elapsedTime = Date.now() - timeoutStartTime;
                        remainingTimeout = Math.max(31000 - elapsedTime, 0);
                    }
                } else {
                    // Resume everything
                    if (hasInteracted) {
                        audioElement.play().catch(error => {
                            console.log('Audio playback failed:', error);
                        });
                    }
                    modelAction.paused = false;
                    video.play();
                    playButton.classList.remove('paused');

                    // Resume timeout with remaining time
                    if (remainingTimeout > 0) {
                        timeoutStartTime = Date.now();
                        animationTimeout = setTimeout(() => {
                            modelAction.paused = true;
                        }, remainingTimeout);
                    }
                }
                isPlaying = !isPlaying;
            });

            // Video player'ı konumlandır
            videoMesh.position.set(0, 0.7, 0);
            videoMesh.rotation.x = 0;

            // Modelleri anchor'a ekle
            const anchor = mindarThree.addAnchor(0);
            anchor.group.add(model.scene);
            videoMesh.add(bgMesh);
            anchor.group.add(videoMesh);
            anchor.group.add(platformMesh);

            // Target görünür olduğunda ve kaybolduğunda
            anchor.onTargetFound = () => {
                playButton.classList.remove('paused');
                if (hasInteracted) {
                    audioElement.play().catch(error => {
                        console.log('Audio playback failed:', error);
                    });
                }
                modelAction.play();
                video.play();
                document.getElementById('videoControlsContainer').style.display = 'flex';
                // 31 saniye sonra animasyonu durdur
                timeoutStartTime = Date.now();
                remainingTimeout = 31000;
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
                playButton.classList.add('paused');
                // Timeout'u temizle
                if (animationTimeout) {
                    clearTimeout(animationTimeout);
                }
            };

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