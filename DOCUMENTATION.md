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
# Parcours documentaire sur téléphone

L'utilisateur choisit séparément l'appareil photo ou un fichier existant (image, PDF, texte). Le PDF texte est lu dans le navigateur ; les pages image passent par OCR dans le navigateur. Le document et les données patient ne sont pas transmis au serveur. L'analyse locale ne transmet au catalogue que des termes techniques reconnus. Après une recherche UDI-DI, le fabricant et le modèle trouvés dans GUDID sont affichés et les sources fabricant connues sont recherchées automatiquement.

Le catalogue lie des familles à des sources officielles, pas des conditions IRM à un patient. Il ne contient actuellement aucune notice IRM de modèle exact avec paramètres structurés et vérifiés. Par conséquent l'interface indique « aucun paramètre vérifié » et n'affiche aucun réglage machine automatique. L'identification d'un modèle ou d'un système complet et la validation clinique exigent la notice applicable et le protocole du service. Le numéro de série seul ne constitue pas un UDI-DI et ne permet pas une recherche universelle publique.

# Recherche fabricant et modèle (octobre 2026)

Le bouton « Rechercher par fabricant et modèle » appelle `/api/search` :
requête openFDA/GUDID sur fabricant + modèle exact, référence catalogue exacte
ou marque exacte. Les résultats restent des candidats. Une panne du fournisseur
est distinguée d'une absence dans ce catalogue américain. Aucun numéro de série
ni document complet n'est envoyé par cette recherche.

L'analyse locale relève les noms de fabricants, les champs explicitement
étiquetés modèle/REF et les UDI GS1 `(01)`. Elle laisse les champs vides en cas
de fabricants ou modèles multiples ; chaque composant doit être recherché
séparément. L'OCR peut mal lire une référence : confirmation sur l'original requise.

Les portails officiels Medtronic FR, Abbott US et BIOTRONIK complètent les trois
pistes initiales. Ils ne constituent pas une récupération automatique du PDF
exact ni une base vérifiée de conditions IRM. Le bouton de recherche ne constitue
pas une validation clinique, et cette correction ne fournit pas encore des
réglages Siemens automatiques. L'objectif 70–80 % reste à mesurer sur des cartes
représentatives anonymisées.

Validation : `python -m unittest -v` ; `node test_identification.cjs`.
Référence API : https://open.fda.gov/apis/device/udi/searchable-fields/
