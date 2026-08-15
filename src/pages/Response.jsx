import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useEffect, useState, useRef } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Camera, Copy, Volume2 } from 'lucide-react'

const Response = () => {
    const location = useLocation()
    // Grab the image from state
    const imageFile = location.state?.imageFile;
    const imageDataURL = location.state?.imageDataURL;
    // console.log(image)

    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);

    if (!imageDataURL) {
        return (
            <div className="poppins pt-20">
                <h1 className="serif text-center mx-auto font-bold text-6xl">No Image Found</h1>
                <p className="text-gray-700 mx-auto p-6 text-center text-lg">Looks like you haven't captured anything yet :(</p>
                <Link to="/" className="underline text-blue-800 hover:text-blue-700 font-medium text-lg p-4">
                    <p className="text-center mx-auto">&larr; Go back home to take a photo</p>
                </Link>
            </div>
        )
    }

    const fileInputRef = useRef(null)
    const navigate = useNavigate()

    const handleImage = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Convert image to base64
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const imageDataURL = event.target.result;
            setRefreshKey(k => k + 1)
            // Send to "/response" route
            navigate('/response', { state: { imageFile: file, imageDataURL: imageDataURL } })
        }
    }

    const openCamera = () => {
        fileInputRef.current.click()
    }

    // Call API when page loads
    useEffect(() => {
//         const controller = new AbortController();

        const callAPI = async () => {
            try {
                setLoading(true);
                setError(null);
                setCopied(false);
                setDescription('');
                const formData = new FormData();
                formData.append('file', imageFile);

                const apiURL = "https://opsis-api.onrender.com/analyze";

                const response = await fetch(apiURL, {
                    method: 'POST',
                    body: formData,
                    // signal: controller.signal
                });
                const data = await response.json();
                console.log(data);

                if (data.success) {
                    setDescription(data.description);
                } else {
                    setError(data.error)
                }
            }
            catch (error) {
                // if (error.name === "AbortError") return;
                console.log("Error: ", error.message);
                if (error.message == "NetworkError when attempting to fetch resource.") {
                    setError("Analysis failed. Please check your internet connection!");
                    setDescription("Yo.")
                } else {
                    setError(error.message);
                }
            }
            finally {
                setLoading(false);
            }
        };

        callAPI();

        // return () => controller.abort();
    }, [imageFile, refreshKey]);

    // Hook for typing effect on description gotten
    // from back-end
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
           setDisplayText(description.slice(0, i));
           i++;
           if (i > description.length) clearInterval(interval);
        }, 30);
    }, [description]);

    // Copy functionality
    const handleCopy = () => {
        if (description) {
            navigator.clipboard.writeText(description);
            setCopied(true);
            setTimeout(() => {
                setCopied(false)
            }, 1000 * 3);
        }
    }

//     const text = "This appears to be a silhouette of a person, likely male, standing against a bright, plain white background. The entire figure is completely black because the light source is behind them, making it impossible to see any facial features or details of their clothing, only the outline. You can clearly see the shape of their head with short hair, and they appear to be wearing a high-necked top, perhaps a turtleneck. The overall effect is very anonymous and a bit mysterious, focusing solely on the form rather than identity.";

    // Speech functionality
    const toggleSpeak = () => {
      if (!description) return;

      if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
      } else {
            const utterance = new SpeechSynthesisUtterance(description);
            utterance.rate = 0.80;
            utterance.pitch = 1.4;
            utterance.volume = 1;
            // Get all available voices
            const voices = window.speechSynthesis.getVoices();
            // Pick female voices
            const femaleVoice = voices.find(voice => {
                voice.name.toLowerCase().includes("female") || voice.name.includes("Samantha")  || voice.name.includes("Google UK English Female") || voice.name.includes("Zira") || voice.name.toLowerCase().includes("zira") || voice.name.toLowerCase().includes("susan") || voice.name.toLowerCase().includes("karen") || voice.gender === "female"
            });
            console.log(voices);
            console.log(femaleVoice)

            utterance.voice = femaleVoice || voices.find(v => v.lang.startsWith("en")) || voices[0];
            console.log("Using voice:", utterance.voice?.name);

            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
      }
    };

    useEffect(() => {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }, []);

    // speak(text);

    return (
        <>
            <div>
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImage} className="hidden" />
                <div className="lg:w-[60%] lg:mx-auto lg:border lg:border-gray-300 lg:rounded-md lg:mt-10 mb-10 lg:shadow-sm lg:shadow-black-500/80">
                    <div className="flex flex-col justify-center items-end me-5">
                        <div className="bg-blue-800 w-[240px] h-[240px] lg:w-[230px] lg:h-[230px] rounded-tr-sm rounded-tl-3xl rounded-bl-3xl rounded-br-3xl flex flex-col justify-center items-start my-15">
                            <img src={imageDataURL} alt="Photo" className="w-[220px] h-[220px] lg:w-[210px] lg:h-[210px] rounded-3xl m-2 text-center mx-auto" />
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-start ms-5">
                        <div className="flex gap-5 mb-3">
                            { !loading && description && (<div className="flex items-center justify-center gap-1 pointer hover:scale-110 focus:scale-110 active:scale-110 hover:text-gray-800 transition text-sm poppins text-gray-800 cursor-pointer" onClick={handleCopy} title="Copy description">
                                <Copy className="text-black" />
                                { copied ? 'Copied!' : 'Copy' }
                            </div>) }
                            { !loading && description && (<div className="flex items-center justify-center gap-1 pointer hover:scale-110 hover:text-gray-800 transition text-sm poppins text-gray-800 cursor-pointer" onClick={toggleSpeak} title={ isSpeaking ? 'Stop speaking' : 'Start speaking' }><Volume2 className="text-black" fill={ isSpeaking ? "currentColor" : "none" } /> { isSpeaking ? 'Speaking...' : 'Speak' }</div>) }
                        </div>
                        <div className="border border-gray-300 p-5 w-[85%] lg:w-[65%] backdrop-blur-lg rounded-4xl shadow-sm shadow-gray-800/50 hover:shadow-md focus:shadow-md active:shadow-md transition-shadow rounded-tl-sm rounded-tr-3xl rounded-bl-3xl rounded-br-3xl">
                            { loading && <p className="serif text-gray-800 leading-relaxed text-center mx-auto">Opsis analyzing image...</p> }
                            { error && <p className="serif text-red-700 leading-relaxed text-center mx-auto italic">{ error }</p> }
                            { !error && !loading && <p className="poppins font-bold text-gray-900 leading-relaxed text-center mx-auto">{ displayText }</p> }
                        </div>
                    </div>
                </div>

                <p className="poppins underline text-blue-800 hover:text-blue-700 font-bold text-md text-center mx-auto flex justify-center gap-1 cursor-pointer fixed bottom-15 left-0 w-full" onClick={openCamera}>
                    <span className="flex gap-1 p-[6px] rounded-full border-black-500/50 z-10 bg-white/5 backdrop-blur-sm">
                        Capture another thing <Camera />
                    </span>
                </p>
            </div>
        </>
    )
}

export default Response
