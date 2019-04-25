Therese Forsberg, tfoyt09, Webprogrammering, 1dv527, Assignment 3

# Väderstation och klient med sonifiering av väderdata

Det här projektet består av två delar. En raspberrypi-baserad "webthing" som samlar väderdata och en klient som presenterar väderdatat och använder det till en sonifiering. Längst ner finns en sammanfattande presentationsvideo.

## Väderstationen
För projektet valdes en direkt integrering strategin eftersom det är ett projekt som är av mer personlig karaktär med väldigt lokal väderdata från min egen uteplats. Det finns ingen plan i nuläget att tillgängligöra min "webthing" utanför det lokala näverket. 

Det finns möjlighet att genom en dynamisk DNS tjänst tillgängligöra väderstationen utanför mitt lokala nätverk, om det skulle finnas intresse för det framledes. Det gör direkt implementering strategin mycket lämplig för mindre projekt som troligtvis inte kommer utsättas för mycket klientraffik och då det finns tillgång till snabbt wi-fi och kontinuerlig strömförsörjning.

Raspberry pi:en installerades med operativsystemet Raspbian, Node.js version 8.11 och version 5.5.1 av npm. Versionerna är i nuläget viktigt för kompatibilitet med de olika biblioteken som används för att hämta data från sensorena till node.js. 


Kopplat till raspberry pi:ens GPIO-pins finns ett antal sensorer.

| Mätdata       | Sensor     | BMC Pin | Pintyp                | 
| --------------|:----------:|:-------:| ---------------------:|
| Temperatur    | DHT22      |   15    | SDO Clock             |
| Luftfuktighet | DHT22      |   15    | SDO Clock             |
| Ljusstyrka    | TSL2561    |   2,3   | I2C1 Clock, I2C Clock |
| Lufttryck     | BMP280     |   2,3   | I2C1 Data, I2C Clock  |

Kopplingsschema
![Kopplingsschema](https://github.com/1dv527/tfoyt09-examination-3/blob/master/reportImg/schema.png "Kopplingsschema")

En Expresserver implementerades och tillgängliggör sensordatat genom ett restful api implementerat enligt "Web thing model".

Klienter kan hämta väderdata genom en GET request direkt på olika "properties" eller som en "action" starta en webhook prenumeration som skickar väderdatat till den anmälda url:en när väderdatat uppdateras. 

Som en säkerhetsåtgärd skickar api:et med en secret när anmälan görs så att klienten kan kontollera att datat kommer från rätt api.


## Klient med sonifiering
Klientapplikationen prenumererar på väderdatat genom api:et. Väderdatat presenteras i webbläsaren visuellt men även som en sonifiering, alltså en ljudlig representation av väderdatat. 

Sonifieringar används av olika skäl inom vitt skilda områden som till exempel konst, vetenskap och som användargränssnitt. Det kan helt enkelt finnas många själ till att välja göra en sonifiering. En ickevisuell representation av data kan ge nya perspektiv på data eller underlätta användandet av webben för olika grupper som av olika själ inte föredrar visuella intryck. 

Eftersom detta område intresserar mig mycket såg jag i detta projekt en möjlighet att lära mig mer om och undersöka dynamiskt skapande med ljud i webbläsaren. För utvecklandet av denna sonifiering användes biblioteket tone.js.

Sonifieringen bygger på en drone som har ljusstyrkan som bas. En brusmatta ligger i bakgrunden och den förstärks i sina lägre frekvenser med sänkt lufttryck. Luftfuktigheten styr hur mycket reverb som ljuden klingar i och temperaturen styr tonhöjden på en klingande synthljud. Ljudexempel hörs i videopresentationen nedan.

## Videopresentation

[![Watch the video](https://img.youtube.com/vi/283snLShmtw/maxresdefault.jpg)](https://youtu.be/283snLShmtw)

https://youtu.be/283snLShmtw

