MR-DMI — aide à la préparation du dossier IRM
Version 2026-10-07.14

Application : https://mr-dmi-1.onrender.com/

Lecture locale des cartes, identification de candidats, sources officielles et comparaison partielle des conditions documentées.
Parcours manipulateur IRM, prescripteur et secrétariat ; inventaire des composants ; synthèse imprimable et texte ; jusqu’à quatre profils de machines conservés sur l’appareil.

Couverture automatique limitée aux références explicitement répertoriées dans identification.js. Les autres références restent à documenter avec leur notice exacte.
Les résumés intégrés sont incomplets : l’application ne délivre aucune autorisation d’examen.

Développement
Python 3, Flask, Gunicorn ; JavaScript navigateur.
Installer requirements.txt puis lancer python app.py.
Tests : python -m unittest test_engine test_identification test_api
Tests navigateur logiques : node test_identification.cjs
Les jeux de tests utilisent des identifiants fictifs.

Voir VALIDATION.md pour les tests, notices intégrées et travaux encore nécessaires avant un usage clinique généralisé.
Aucun nom patient, photographie ou document patient ne doit être ajouté au dépôt public.
