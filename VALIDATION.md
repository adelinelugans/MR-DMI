# État vérifié — 7 octobre 2026

Version 2026-10-07.8 : outil documentaire partiel, sans autorisation d'examen.

## Livré

- OCR local image/PDF, correction manuelle ; références et numéros de série distincts.
- Recherche fabricant/modèle openFDA et UDI ; résultats candidats.
- Douze pistes documentaires officielles ; pays et périmètre affichés.
- Parcours équipe IRM, prescripteur, secrétariat : adaptation d'affichage, sans comptes ni habilitations.
- Inventaire des composants, groupe de système, références à confirmer.
- Résumés partiels : Cochlear CI612/622/624/632 ; Abbott neuro 3660/3662 avec 3186 60 cm ; Omnipod 5/DASH ; huit boîtiers Abbott cardiaques avec associations de sondes explicitement couvertes.
- Vérification des limites citées ; aucun raisonnement de compatibilité par proximité de champ (notamment 0,55 T).
- Synthèse technique locale imprimable/PDF via navigateur et texte téléchargeable avec liens des sources. Toute modification invalide la synthèse.

## Provenance cardiaque

Source fabricant : https://manuals.eifu.abbott/content/dam/av/manuals-eifu/global/AM/en/ARTEN600159320_A.PDF

Référence ARTEN600159320 A, août 2022, document anglais global. Pages imprimées 2–6, 8 et 15–18. Applicabilité France et version actuelle non confirmées. Aucune certification clinique de la transcription. Une ancienne autre notice fabricant présente des restrictions différentes : ne jamais fusionner les versions.

## Validation réalisée

- 11 tests Python (recherche, comparaison et identification).
- Contrôles JavaScript : extraction, références non confirmées, champs, limites numériques, longueurs, fabricants, séparation de systèmes, multiples générateurs, extensions, parcours métier.
- Vérification en production avec références fictives : association PM2272 + 2088TC 52 cm, affichage de la provenance et comparaison partielle ; parcours incomplet secrétariat ; recherche FDA.
- Un test OCR sur la photo fournie reconnaît une famille et certains indices ; il ne constitue pas une mesure de performance. Aucun document patient dans le dépôt.

## Dépendances avant généralisation clinique

1. Notices locales actuelles, archivage/version et relecture indépendante des règles : couverture encore limitée ; antennes, position, implantation, programmation, surveillance, exclusions, SAR/B1+rms et délais non intégralement structurés.
2. Jeu de cartes et systèmes représentatifs anonymisés, vérité de référence et mesure des erreurs ; objectif 70–80 % non mesuré.
3. Référentiel des machines réellement installées et configurations RF, contrôlé avec documentation constructeur ; aucun menu Siemens universel présumé.
4. Architecture de dossiers partagés, habilitations, audit, sauvegarde et hébergement à définir avant stockage de données patient. Cette version ne crée pas de dossier patient.
5. Revue du cadre applicable à l'usage prévu et validation du service avant diffusion clinique. Une validation de tests logiciels ne constitue pas cette revue.

Les fonctions d'historique patient, d'authentification et de veille automatique avec validation documentaire ne sont pas livrées. Aucun statut « examen autorisé » n'est produit.

## Version 2026-10-07.11 — contrôle technique conditionnel

Le sous-ensemble Abbott pacemaker déjà intégré compare aussi tunnel horizontal cylindrique, noyau hydrogène, position dorsale bras le long du corps et implantation pectorale. Antenne émettrice corps à 3 T ; corps ou émission/réception locale tête/membre à 1,5 T. CP obligatoire à 3 T et pour les antennes locales à 1,5 T. Source : ARTEN600159320 A, pages imprimées 2–6. Les champs restent inconnus par défaut. Ces règles ne sont pas extrapolées aux implants cochléaires ou neurostimulateurs. Les restrictions cliniques, la notice France et la revue indépendante restent à compléter : aucun résultat n’autorise l’IRM. Tests : champs manquants, antenne locale à 3 T, CP, autres géométries/noyaux/positions/sites, champ hors fiche.

## Version 2026-10-07.12 — entrées API

La recherche AccessGUDID accepte uniquement un DI GS1 numérique à 14 chiffres. Les numéros de série et autres saisies sont rejetés avant accès réseau ou base. Les DI d'autres formats doivent être traités via une autre procédure, non couverte ici. Une comparaison JSON non objet renvoie 400. Tests API vérifient l'absence d'appel réseau et de base sur saisie invalide.

## Version 2026-10-07.13 — notices et parcours élargis

- Recherche documentaire directe de références exactes : Abbott pacing et Cochlear Nucleus. Les portails généraux restent des pistes pour les autres modèles.
- Cochlear : CI612/622/624/632 et CI512/522/532. Source EMEA française reliée depuis le portail France : D1872143-V3 (traduction D1846037-V5, 2024-07). Contrôle SAR selon champ, modèle, affichage tête et repère corps ; aimant et kit par implant ; position et alignement ; retrait des éléments externes ; artefacts. Ne pas reprendre les valeurs d'une notice canadienne ni d'une autre version. La colonne corps proche de la tête impose repère inférieur à T1 ET au plus 40 cm ; toute autre situation reste inconnue.
- MiniMed 780G : manuel français fabricant MAPS 521121-048, page 38. Tandem t:slim X2 Control-IQ : sécurité fabricant Royaume-Uni, applicability France à confirmer. Retrait et continuité du traitement sont contrôlés séparément ; aucune dose proposée.
- Jusqu'à quatre profils machine locaux, sans document patient ni paramètres d'exposition enregistrés. Le champ, la géométrie, le noyau, le gradient spatial B0 et le slew rate sont des valeurs déclarées par le centre ; aucune caractéristique de machine n'est déduite du seul nom commercial. Charger un profil préserve l'inventaire réel et efface les valeurs RF à reconfirmer.
- Tests : limites SAR et égalités, affichage tête absent, repère hors tableau, aimant CI500 à 3 T, kit manquant, implants bilatéraux, retrait pompe, exclusion des données patient et exposition des profils, recherche exacte sans correspondance partielle.

La version demeure un outil de préparation documentaire. Aucun système n'a le statut revue clinique complète. Il manque notamment une revue indépendante de chaque règle et notice, un jeu représentatif de cartes anonymisées pour mesurer l'identification, les protocoles du centre, et l'organisation de déploiement clinique avec habilitations et suivi qualité.
