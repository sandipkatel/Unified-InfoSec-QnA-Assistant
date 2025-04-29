
import speech_recognition as sr

def speech_to_text():
    """
    This function uses the SpeechRecognition library to convert speech to text.
    It listens for audio input from the microphone and prints the recognized text.
    """
    # Create a recognizer instance
    r = sr.Recognizer()

    # Use the microphone as source for input
    with sr.Microphone() as source:
        # Adjust for ambient noise
        r.adjust_for_ambient_noise(source, duration=0.2)

        # Listen for audio input
        audio = r.listen(source)

        try:
            # Recognize speech using Google Web Speech API
            text = r.recognize_google(audio)
            return text.lower()
        except sr.UnknownValueError:
            return "Could not understand the audio"
        except sr.RequestError as e:
            return f"Could not request results; {e}"
# # Initialize the recognizer
# r = sr.Recognizer()

# # speak

# while(1):

#     # exceptions at the runtime
#     try:

#         # use the microphone as source for input.
#         with sr.Microphone() as src:

#             # wait for a second to let the recognizer
#             # adjust the energy threshold based on
#             # the surrounding noise level
#             r.adjust_for_ambient_noise(src, duration=0.2)

#             #listens for the user's input
#             audio = r.listen(src)

#             # Using google to recognize audio
#             MyText = r.recognize_google(audio)
#             MyText = MyText.lower()

#             print(MyText)

#     except sr.RequestError as e:
#         print("Could not request autio to text: {0}".format(e))

#     except sr.UnknownValueError:
#         print("Unknown error occurred while processing the audio")