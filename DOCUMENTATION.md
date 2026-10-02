# Moteur documentaire MR-DMI

`catalog.json` contient des pistes de recherche **sans données patient**. Chaque entrée
indique son périmètre (famille ou référence exacte), un fabricant, une source et
un statut. Une entrée de famille n'a aucune condition IRM attribuable à un patient.

La recherche `/api/catalog?q=...` est volontairement limitée à des termes courts
de dispositif. Le document complet reste dans le navigateur. AccessGUDID complète
l'identification, mais son champ américain et les anciennes implantations
expliquent des absences. Un enregistrement GUDID ne remplace pas la notice.

La comparaison `/api/compare` reçoit des **limites recopiées de la notice exacte**
et des paramètres d'examen. Elle signale un dépassement numérique certain ou
laisse le critère inconnu. Elle ne certifie jamais une compatibilité : l'identité
de chaque composant, les antennes, la position, les délais, la programmation,
les durées propres à la notice et le protocole local nécessitent une revue.
Ne pas enregistrer de documents médicaux, noms, numéros de séjour ou images dans
le dépôt ni dans `catalog.json`.

Pour ajouter une notice : identifier sa référence exacte, relever la version et
l'URL du fabricant, faire relire ses conditions par un professionnel compétent,
puis seulement créer une entrée de référence. Conserver les familles comme pistes
séparées. Les limites numériques ne sont pas encore alimentées automatiquement.
