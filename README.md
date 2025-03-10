# Access Control Testing

## Library lokal installieren & verwenden

Um die Library lokal im Demo-Projekt testen zu können, sind folgende Schritte notwendig:

- Library bauen
- Library lokal mit Hilfe von [yalc](https://github.com/wclr/yalc) publishen
- Library im Demo-Projekt hinzufügen

Hierfür können folgende Befehle ausgeführt werden, nachdem yalc global installiert wurde (`npm install -g yalc`):

```bash
npm run build
npx yalc publish
cd demo-application
npx yalc add access-control-testing
```

Um die Library zu updaten: `npx yalc update access-control-testing`
