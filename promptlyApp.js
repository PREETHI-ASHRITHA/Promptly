import { LightningElement } from 'lwc';
import { getApiName, invokeFlow } from 'lightning/flow';

export default class Promptly extends LightningElement {
    statusMessage = '';
    timeInMinutes = '';
    userEmail = ''; 

    handleTimeChange(event) {
        this.timeInMinutes = event.target.value;
    }

    
    handleEmailChange(event) {
        this.userEmail = event.target.value;
    }

    startListening() {
        if (!('webkitSpeechRecognition' in window)) {
            this.statusMessage = 'Sorry, your browser does not support voice input.';
            return;
        }

        const SpeechRecognition = window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        this.statusMessage = `Listening for a reminder (for ${this.timeInMinutes} mins)...`;
        
        const confirmationAudio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); 
        confirmationAudio.play();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.statusMessage = `Reminder set: "${transcript}"`;
            this.callFlow(transcript);

            const timeInMs = this.timeInMinutes * 60 * 1000;
            setTimeout(() => {
                this.showNotification(transcript);
            }, timeInMs);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.statusMessage = 'Error with voice input. Please try again.';
        };

        recognition.start();
    }
    
    showNotification(reminderText) {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Promptly Reminder", {
                    body: reminderText,
                    icon: "https://www.salesforce.com/content/dam/web/en_us/www/images/salesforce-logo-icon.png"
                });
            }
        });
    }

    callFlow(reminderText) {
        const flowApiName = 'CreatePromptlyReminder'; 
        
        const inputVariables = [
            {
                name: 'reminderText',
                type: 'String',
                value: reminderText
            },
            {
                name: 'timeInMinutes',
                type: 'Number',
                value: this.timeInMinutes
            },
            
            {
                name: 'userEmail',
                type: 'String',
                value: this.userEmail
            }
        ];

        invokeFlow(flowApiName, inputVariables)
            .then(() => {
                console.log('Flow started successfully.');
            })
            .catch((error) => {
                this.statusMessage = 'Error creating reminder.';
                console.error('Flow failed to start:', error);
            });
    }
}
