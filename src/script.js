// /* BÖLÜM 2 ımage tracking */
import * as THREE from 'three';
import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import glbModel from './assets/businnesCard/model_sunum_anim.glb?url';
import glbModelTest from './assets/businnesCard/model_sunum_anim.glb?url';
import previewVideo from './assets/businnesCard/technoSoftWebsitePreviewCorped3.mp4'
import fbxModelAudio from './assets/businnesCard/businessCardSpeech.mp3?url';
// import targetMind from './assets/businnesCard/vcard2.mind?url';
import targetMind from './assets/businnesCard/multipleTarget.mind?url'; // MindAR hedef dosyası
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { mockWithImage } from './libs/camera-mock';
import { mockWithVideo } from './libs/camera-mock';
import gsap from 'gsap';

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

            //mockWithImage('./assets/businnesCard/mockimg.jpeg'); // Mocking with an image for testing
            mockWithVideo('./assets/businnesCard/mockvideo2.mp4');

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
            const bgMeshClone = bgMesh.clone();

            bgMesh.position.set(0, 0, -0.03); // Video mesh'in hemen arkasına yerleştir
            bgMeshClone.position.set(0, 0, -0.03); // Video mesh'in hemen arkasına yerleştir

            // Video player'ı konumlandır
            videoMesh.position.set(0, 0.7, 0);
            videoMesh.rotation.x = 0;

            videoMesh.add(bgMesh);

            // Platform (Cylinder)
            const platformGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
            const platformMaterial = new THREE.MeshBasicMaterial({
                color: 0x1b2a47,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
            const platformMeshClone = platformMesh.clone();

            platformMesh.scale.set(0.35, 0.35, 0.35);
            platformMesh.position.set(0, -0.32, 0.2);
            platformMesh.rotation.y = Math.PI/2;

            platformMeshClone.scale.set(0.35, 0.35, 0.35);
            platformMeshClone.position.set(0, -0.32, 0.2);
            platformMeshClone.rotation.y = Math.PI/2;

            // Text Geometry
            // Font yükleme
            const fontLoader = new FontLoader();
            // Text Mesh1
            let textMesh = null;
            fontLoader.load(
            './assets/businnesCard/Cascadia Mono Medium_Regularfixed.json',
            (font) => {
                // Text geometry oluşturma
                const textGeometry = new TextGeometry('SOFTWARE DEVELOPMENT', {
                    font: font,
                    size: 0.15,          // Metin boyutu küçültüldü
                    height: 0.001,       // Çok düşük derinlik
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.0005, // Bevel kalınlığı azaltıldı
                    bevelSize: 0.008,     // Bevel boyutu azaltıldı
                    bevelOffset: 0,
                    bevelSegments: 2
                });

                // Text mesh'i ortala
                textGeometry.computeBoundingBox();
                const centerOffset = new THREE.Vector3();
                textGeometry.boundingBox.getCenter(centerOffset).multiplyScalar(-1);

                const textMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xffffff,
                    specular: 0x999999
                });

                textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.scale.x = 0.001;
                textMesh.scale.y = 0.001;
                textMesh.scale.z = 0.001;

                // Text mesh'i tam ortalama
                textGeometry.computeBoundingBox();
                const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                
                textMesh.position.x = -textWidth / 4;
                textMesh.position.y = -textHeight / 2 + 0.2; // Y pozisyonunu biraz yukarı kaydır
                textMesh.position.z = 0;
            }
            );  

            // Text Mesh2
            let textMesh2 = null;
            fontLoader.load(
            './assets/businnesCard/Cascadia Mono Medium_Regularfixed.json',
            (font) => {
                // Text geometry oluşturma
                const textGeometry = new TextGeometry('DIGITAL PUBLISHING', {
                    font: font,
                    size: 0.15,          // Metin boyutu küçültüldü
                    height: 0.001,       // Çok düşük derinlik
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.0005, // Bevel kalınlığı azaltıldı
                    bevelSize: 0.008,     // Bevel boyutu azaltıldı
                    bevelOffset: 0,
                    bevelSegments: 2
                });

                // Text mesh'i ortala
                textGeometry.computeBoundingBox();
                const centerOffset = new THREE.Vector3();
                textGeometry.boundingBox.getCenter(centerOffset).multiplyScalar(-1);

                const textMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xffffff,
                    specular: 0x999999
                });

                textMesh2 = new THREE.Mesh(textGeometry, textMaterial);
                textMesh2.scale.x = 1;
                textMesh2.scale.y = 1;
                textMesh2.scale.z = 0.001;

                // Text mesh'i tam ortalama
                textGeometry.computeBoundingBox();
                const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                
                textMesh2.position.x = -textWidth / 4;
                textMesh2.position.y = -textHeight / 2 + 0.2; // Y pozisyonunu biraz yukarı kaydır
                textMesh2.position.z = 0;
            }
            );  

             // Text Mesh3
            let textMesh3 = null;
            fontLoader.load(
            './assets/businnesCard/Cascadia Mono Medium_Regularfixed.json',
            (font) => {
                // Text geometry oluşturma
                const textGeometry = new TextGeometry('WEB AR DEVELOPMENT', {
                    font: font,
                    size: 0.15,          // Metin boyutu küçültüldü
                    height: 0.001,       // Çok düşük derinlik
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.0005, // Bevel kalınlığı azaltıldı
                    bevelSize: 0.008,     // Bevel boyutu azaltıldı
                    bevelOffset: 0,
                    bevelSegments: 2
                });

                // Text mesh'i ortala
                textGeometry.computeBoundingBox();
                const centerOffset = new THREE.Vector3();
                textGeometry.boundingBox.getCenter(centerOffset).multiplyScalar(-1);

                const textMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xffffff,
                    specular: 0x999999
                });

                textMesh3 = new THREE.Mesh(textGeometry, textMaterial);
                textMesh3.scale.x = 1;
                textMesh3.scale.y = 1;
                textMesh3.scale.z = 0.001;

                // Text mesh'i tam ortalama
                textGeometry.computeBoundingBox();
                const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                
                textMesh3.position.x = -textWidth / 4;
                textMesh3.position.y = -textHeight / 2 + 0.2; // Y pozisyonunu biraz yukarı kaydır
                textMesh3.position.z = 0;
            }
            );

            // Text Mesh4
            let textMesh4 = null;
            fontLoader.load(
            './assets/businnesCard/Cascadia Mono Medium_Regularfixed.json',
            (font) => {
                // Text geometry oluşturma
                const textGeometry = new TextGeometry('WEB DESIGN', {
                    font: font,
                    size: 0.15,          // Metin boyutu küçültüldü
                    height: 0.001,       // Çok düşük derinlik
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.0005, // Bevel kalınlığı azaltıldı
                    bevelSize: 0.008,     // Bevel boyutu azaltıldı
                    bevelOffset: 0,
                    bevelSegments: 2
                });

                // Text mesh'i ortala
                textGeometry.computeBoundingBox();
                const centerOffset = new THREE.Vector3();
                textGeometry.boundingBox.getCenter(centerOffset).multiplyScalar(-1);

                const textMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xffffff,
                    specular: 0x999999
                });

                textMesh4 = new THREE.Mesh(textGeometry, textMaterial);
                textMesh4.scale.x = 1;
                textMesh4.scale.y = 1;
                textMesh4.scale.z = 0.001;

                // Text mesh'i tam ortalama
                textGeometry.computeBoundingBox();
                const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                
                textMesh4.position.x = -textWidth / 4;
                textMesh4.position.y = -textHeight / 2 + 0.2; // Y pozisyonunu biraz yukarı kaydır
                textMesh4.position.z = 0;
            }
            );
            
            // Cam küre için materyal oluşturma
            const sphereMaterial = new THREE.MeshPhysicalMaterial({
                metalness: .9,
                roughness: .05,
                envMapIntensity: 0.9,
                clearcoat: 1,
                transparent: true,
                opacity: .5,
                reflectivity: 0.2,
                refractionRatio: 0.985,
                ior: 0.9,
                side: THREE.BackSide,
            });
            
            // Küre geometrisi oluşturma
            const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
            const glassSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            glassSphere.scale.set(0.1, 0.1, 0.1);

            // GLB model yükleyici ve animasyon
            let model_mixer;

            const loader = new GLTFLoader();
            const model = await loader.loadAsync(glbModel, (xhr) => {
                const yuzde = Math.round((xhr.loaded / xhr.total) * 100);
                console.log(`3D Model Yükleniyor: %${yuzde}`);
                document.getElementById('progressContainer').innerText = `Yükleniyor: %${yuzde}`;
                if (yuzde === 100) {
                    console.log('3D Model yükleme tamamlandı! 🚀');
                    document.getElementById('touchToScreenContent').style.display = 'block';
                    document.getElementById('progressContainer').style.display = 'none';
                }
            });

            // Scale and position adjustments for the GLB model
            model.scene.scale.set(0.4, 0.4, 0.4);
            model.scene.position.set(0, -0.3, 0.2);
            model.scene.rotation.x = 0;
            model.scene.rotation.y = 0.5;

            // Setup animation mixer
            model_mixer = new THREE.AnimationMixer(model.scene);
            const modelAction = model_mixer.clipAction(model.animations[0]);
            modelAction.play();
            
            // Audio yükleyici
            const audioElement = new Audio(fbxModelAudio);
            audioElement.load()
            let animationTimeout;
            let hasInteracted = false;

            // Mobil cihazlar için ses kilidini açma fonksiyonu
            const unlockAudio = async () => {
                try {
                    // Ses durumunu kontrol et
                    console.log('Ses durumu:', audioElement.readyState, 'Susturulmuş:', audioElement.muted);

                    // Önce sesi sustur ve yüklenmesini bekle
                    audioElement.muted = true;
                    audioElement.volume = 0;

                    // Yüklenme durumunu bekle
                    if (audioElement.readyState < 2) {
                        await new Promise((resolve) => {
                            audioElement.addEventListener('canplaythrough', resolve, { once: true });
                            //audioElement.load(); // Sesi yeniden yüklemeyi zorla
                        });
                    }

                    // Çok kısa bir ses çal ve hemen durdur
                    const playAttempt = await audioElement.play();
                    if (playAttempt !== undefined) {
                        await playAttempt; // Promise döndürürse bekle
                    }

                    // Ses ayarlarını normale çevir
                    audioElement.muted = false;
                    audioElement.volume = 1;
                    audioElement.currentTime = 0;
                    audioElement.pause();

                    console.log('Ses kilidi başarıyla açıldı');
                    
                    // UI güncellemeleri
                    hasInteracted = true;
                    document.getElementById('touchToScreen').style.display = 'none';
                    document.removeEventListener('click', unlockAudio);

                } catch (error) {
                    console.error('Ses kilidi açılamadı:', error);
                    // Hata durumunda yine de UI'yi güncelle
                    hasInteracted = true;
                    document.getElementById('touchToScreen').style.display = 'none';
                    document.removeEventListener('click', unlockAudio);
                }
            };

            // Kullanıcı etkileşimi için event listener
            document.addEventListener('click', unlockAudio);

            //counter
            let counter = 0;
            let counterInterval = null;
            let isPaused = true;

            function startCounter() {
                if (counterInterval) return; // Zaten çalışıyorsa yeni interval oluşturma
                
                counterInterval = setInterval(() => {
                    if (!isPaused) {
                        counter++;
                        console.log(`Geçen süre: ${counter} saniye`);
                        
                        if (counter >= 31) {
                            counter = 0;
                            clearInterval(counterInterval);
                            counterInterval = null;
                            modelAction.paused = true;
                            //modelActionClone.paused = true;
                            console.log('Animasyon tamamlandı!');
                        }
                    }
                }, 1000);
            }

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

                    isPaused = true; // Sayacı duraklat
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

                // Sayacı başlat veya devam ettir
                isPaused = false;
                startCounter();
                }
                isPlaying = !isPlaying;
            });

            // Modelleri anchor'a ekle
            const anchor = mindarThree.addAnchor(0);
            anchor.group.add(model.scene);
            anchor.group.add(videoMesh);
            anchor.group.add(platformMesh);
            anchor.group.add(textMesh);
            anchor.group.add(textMesh2);
            anchor.group.add(textMesh3);
            anchor.group.add(textMesh4);
            //anchor.group.add(glassSphere);

            // CSS3D anchor
            // const anchor2 = mindarThree.addCSSAnchor(1);
            // anchor2.group.add(obj);
            const anchor2 = mindarThree.addAnchor(1);
            //anchor2.group.add(modelTest.scene);
            
            // Target görünür olduğunda

            anchor.onTargetFound = () => {
                gsap.timeline()
                .fromTo(textMesh.scale, { duration: 0.25, x: 0, y: 0 }, { x: 0.5, y: 0.5 })
                .fromTo(textMesh.position, { duration: 0.25, y: 0 }, { duration: 0.25, y: -0.5, ease: "back.out(1.7)"})
                .fromTo(textMesh2.scale, { duration: 0.25, x: 0, y: 0 }, { x: 0.5, y: 0.5 })
                .fromTo(textMesh2.position, { duration: 0.25, y: 0 }, { duration: 0.25, y: -0.6, ease: "back.out(1.7)"})
                .fromTo(textMesh3.scale, { duration: 0.25, x: 0, y: 0 }, { x: 0.5, y: 0.5 })
                .fromTo(textMesh3.position, { duration: 0.25, y: 0 }, { duration: 0.25, y: -0.7, ease: "back.out(1.7)"})
                .fromTo(textMesh4.scale, { duration: 0.25, x: 0, y: 0 }, { x: 0.5, y: 0.5 })
                .fromTo(textMesh4.position, { duration: 0.25, y: 0 }, { duration: 0.25, y: -0.8, ease: "back.out(1.7)"})
                console.log('Target Found!');
                playButton.style.pointerEvents = "auto";
                playButton.classList.remove('paused');
                document.getElementById('vcard-container').style.bottom = '20px';
                
                if (hasInteracted) {
                    audioElement.play().catch(error => {
                        console.log('Audio playback failed:', error);
                    });
                }
                modelAction.play();
                video.play();
                document.getElementById('videoControlsContainer').style.display = 'flex';
                
                // Sayacı başlat veya devam ettir
                isPaused = false;
                startCounter();
            };

            anchor2.onTargetFound = () => {
                document.getElementById('turnTheCardMessage').style.display = 'flex';
                // console.log('Target Found!');
                // playButton.style.pointerEvents = "auto";
                // playButton.classList.remove('paused');
                // document.getElementById('vcard-container').style.bottom = '20px';
                
                // if (hasInteracted) {
                //     audioElement.play().catch(error => {
                //         console.log('Audio playback failed:', error);
                //     });
                // }
                // //modelActionClone.play();
                // video.play();
                // document.getElementById('videoControlsContainer').style.display = 'flex';
                
                // // Sayacı başlat veya devam ettir
                // isPaused = false;
                // startCounter();
            };

            // Target kaybolduğunda
            anchor.onTargetLost = () => {
                playButton.style.pointerEvents = "none";
                document.getElementById('vcard-container').style.bottom = '-200px';
                isPaused = true; // Sayacı duraklat
                console.log(`Sayac duraklatıldı: ${counter} saniye`);
                
                if (hasInteracted) {
                    audioElement.pause();
                    //audioElement.currentTime = 0;
                }
                modelAction.stop();
                video.pause();
                document.getElementById('videoControlsContainer').style.display = 'none';
                // playButton.classList.add('paused');
                // Timeout'u temizle
                if (animationTimeout) {
                    clearTimeout(animationTimeout);
                }
            };

            anchor2.onTargetLost = () => {
                document.getElementById('turnTheCardMessage').style.display = 'none';
                // playButton.style.pointerEvents = "none";
                // document.getElementById('vcard-container').style.bottom = '-200px';
                // isPaused = true; // Sayacı duraklat
                // console.log(`Sayac duraklatıldı: ${counter} saniye`);
                
                // if (hasInteracted) {
                //     audioElement.pause();
                //     //audioElement.currentTime = 0;
                // }
                // //modelActionClone.stop();
                // video.pause();
                // document.getElementById('videoControlsContainer').style.display = 'none';
                // // playButton.classList.add('paused');
                // // Timeout'u temizle
                // if (animationTimeout) {
                //     clearTimeout(animationTimeout);
                // }
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
                //const camera = mindarThree.camera;

                if (model_mixer) {
                    model_mixer.update(delta);
                }

                // if (model_mixerClone) {
                //     model_mixerClone.update(delta);
                // }
                renderer.render(scene, camera);
                
            });
        } catch (error) {
            console.error('Hata:', error);
            alert('Bir hata oluştu: ' + error.message);
        }
        
    };
    start();
});