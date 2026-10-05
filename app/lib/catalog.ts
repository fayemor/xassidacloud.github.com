/* Emplacement : app/lib/catalog.ts
 *
 * SOURCE UNIQUE des xassidas pour : les pages /xassidas/<nom>, le sitemap et le chatbot.
 * Pour ajouter une xassida : copiez une ligne, modifiez-la. L'adresse (slug) doit être unique
 * et ne doit PLUS changer une fois publiée (Google la retient).
 *
 * Format : [slug, titre, titre arabe, ID Google Drive, description, auteur (vide = Cheikh Ahmadou Bamba)]
 */

export const SITE_NAME = 'Xassida Cloud';
export const DEFAULT_AUTHOR = 'Cheikh Ahmadou Bamba';

/** Adresse publique officielle du site (sans / final). Peut être remplacée par NEXT_PUBLIC_SITE_URL. */
export const DEFAULT_SITE_URL = 'https://www.xassidacloud.com';

export function siteUrl(): string {
    return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

export interface Xassida {
    slug: string;
    title: string;
    arabic: string;
    fileId: string;
    desc: string;
    author: string;
}

const DATA: [string, string, string, string, string, string][] = [
    ["abreuvoir-du-commensal-irwanoun-nadiim","Abreuvoir-du-commensal-irwanoun nadiim","إِرْوَاءُ النَّدِيمِ","13nJseg2jivOGpaZ-UW81TFvapRMfcMDp","L'abreuvoir du commensal, poème de dévotion spirituelle.",""],
    ["achkouroul-laha","Achkouroul laha","أَشْكُرُ اللَّهَ","1DvI_wcyCViy2gzCC0IfTNSM8SfEyb_JU","Je rends grâce à Dieu, hymne de remerciement au Tout-Puissant.",""],
    ["adjabani-raboussama","Adjabani Raboussama","أَجَابَنِي رَبُّ السَّمَاءِ","1gS3U8Di-6nP7WfmhxbMnlu1V9b3v2z8_","Le Seigneur du Ciel m'a répondu, hymne de gratitude divine.",""],
    ["ahmadu-muhniyan","Ahmadu Muhniyan","أَحْمَدُ مُغْنِيًا","10AXIq5hMy4yU_OWhTirdVbkRMfTI6UK1","Ahmad, Celui qui enrichit. Panégyrique pour le Prophète.",""],
    ["ahnaniyal","Ahnaniyal","أَغْنَانِي","1xyZ8FyOA8bA-rh3d-w51UQ7OCDLA0ul4","Il m'a enrichi, témoignage des bienfaits divins.",""],
    ["ajabani-xayru-baa","Ajabani Xayru baa","أَجَابَنِي خَيْرُ دَاعٍ","1AhWmvmdQ7wTaJFdSJGkU9KE_xIH2QePT","Le meilleur des intercesseurs m'a répondu.",""],
    ["al-baaqi","Al Baaqi","الْبَاقِي","1I8T_iZLsaC2MlXy4yvgROEl2wRmT4g90","L'Éternel, invocation des attributs divins de pérennité.",""],
    ["al-baraka","Al Baraka","الْبَرَكَةُ","1DML-gxMMJxJRnE66z6XsLYiVmJnFuSWy","La Bénédiction, prière pour attirer la grâce divine.",""],
    ["al-haqqu-min-rabikum","Al Haqqu Min rabikum","الْحَقُّ مِنْ رَبِّكُمْ","1chIamPTDvkvilWa1p7opIWRGZb9smmOL","La vérité émanant de votre Seigneur.",""],
    ["al-quraa","Al Quraa","الْقُرْآنُ","1XlpEh49HszA1sRMQABME5fg7SOtxG8n9","Poème dédié à la noblesse et la grandeur du Saint Coran.",""],
    ["ala-inani-ousni","Ala inani Ousni","أَلَا إِنَّنِي","1HtK2A115fzw8vAsxbl2Hi2Wpi_XWd7Vj","Certes, je... Prière d'affirmation de la foi et de la soumission.",""],
    ["alam-nashrah","Alam Nashrah","أَلَمْ نَشْرَحْ","18-DGSgyUJcOV1BdssFY0JOzNtVIBE0uP","Méditation et prière basées sur la sourate de l'Ouverture (Al-Inshirah).",""],
    ["alhamdoulilahi-halaa-louha","Alhamdoulilahi Halaa Louha","الْحَمْدُ لِلَّهِ عَلَى","1YPxtbZJ8umHqePu2qp3p5ExPaeX8eYvN","Louange à Dieu, hymne de reconnaissance.",""],
    ["alhamdoulilahi-lezi-mate-zahab","Alhamdoulilahi lezi mate zahab","الْحَمْدُ لِلَّهِ الَّذِي","1DXi2FvO-1Z8qKKRISCeNQ-zmSq3ZYyrM","Louange à Dieu qui a éloigné la peine.",""],
    ["alhamdoulilahi-lezi-mate-zahab-2","Alhamdoulilahi lezi mate zahab","الْحَمْدُ لِلَّهِ الَّذِي","1ZqVYGbxaSswXP8mNPlwSp61bTo0Fw9ej","Action de grâce pour la dissipation des peines.",""],
    ["alhamdoulilahi-rabil-haalamiina","Alhamdoulilahi Rabil Haalamiina","الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ","18auHjhjYqBTfaYWjpL02Hctgj_g7uCoJ","Louange à Dieu, Seigneur des mondes.",""],
    ["allahu","Allahu","اللَّهُ","1TilpRR7mc-dQbfy5P1p5BqXuQ9Bhn3wm","Dieu. Évocation et louange du Nom suprême.",""],
    ["allahu-ihfaz","Allahu Ihfaz","اللَّهُ احْفَظْ","1jAly_bWkRi7pqAcHjTLuAX3lWbqfNl_i","Ô Allah, protège-nous. Prière de sauvegarde.",""],
    ["allahul-khariibu","Allahul Khariibu","اللَّهُ الْقَرِيبُ","1-U0Rk6bMnrZ87Z7-Crc0PpuvrTanHcYn","Dieu, Le Proche. Invocation de la proximité divine.",""],
    ["anta-rabbii-ar","Anta Rabbii ar","أَنْتَ رَبِّي","1d_eLfoC2Yj2Y4sAa_y2DdFIDuH805oX-","Tu es mon Seigneur, déclaration de foi et d'adoration.",""],
    ["anta-rabii-fr","Anta Rabii fr","أَنْتَ رَبِّي","18iKJbTz4DLexDS-QnFPg-kt41Q-Sk8qv","Traduction ou explication de la prière \"Tu es mon Seigneur\".",""],
    ["ashinu-muhjamatan","Ashinu Muhjamatan","أَشِينُ مُعْجَمَةً","1_QlQ6lYMQ__yFtmxP5BZnr91UDhpk_of","Poème didactique et mystique centré sur la lettre Shin.",""],
    ["asma-u-ahli-badrin-kiraam","Asma-u-Ahli badrin-kiraam","أَسْمَاءُ أَهْلِ بَدْرٍ الْكِرَامِ","1NsEi6EAwD9ZASHYdCaHYftC1JCKcx0B-","Invocation par les noms bénis des nobles combattants de Badr.",""],
    ["asma-ul-lahi-husnaa","Asma-ul-lahi husnaa","أَسْمَاءُ اللَّهِ الْحُسْنَى","14H8BQBI76A4g7asXT4IBWLGbgxlm-dh3","Prière par l'intercession des 99 Noms les plus beaux d'Allah.",""],
    ["asmaou-tahlil-1","Asmaou tahlil 1","أَسْمَاءُ التَّهْلِيلِ","1AaDI5-SKXkAZbUfG_-fkuJXjahQT2HbR","Évocation des noms divins associés au Tahlil (La ilaha illallah).",""],
    ["assiiru-ar","Assiiru Ar","أَسِيرُ","15K5iKpk1lAU6WeoYZBc6o9Iqq5vn-uMS","Je chemine, panégyrique de voyage spirituel.",""],
    ["assiiru-fr","Assiiru Fr","أَسِيرُ","1f6pQB1i8HyBIjJBT_aRdNyyzryo91lah","Version française/explication de l'ode du cheminement spirituel.",""],
    ["astahfiroulaha-bihi","Astahfiroulaha bihi","أَسْتَغْفِرُ اللَّهَ بِهِ","1T3PMH2RzOWQLkogJT4p9ZO6uAaNGViwB","Prière de demande de pardon et de rémission des péchés.",""],
    ["astahfirul-laha-bihi","Astahfirul laha bihi","أَسْتَغْفِرُ اللَّهَ بِهِ","1C4CYz6SiyJtgwK3o2UWhIIhuZL2TbIJl","Magnifique prière de repentir et de purification.",""],
    ["astahfirul-laha-bihi-wolof","Astahfirul laha bihi Wolof","أَسْتَغْفِرُ اللَّهَ بِهِ","1UegGHLCvfLnn_p_IGXdtonJEdh1cBn_E","Commentaire ou traduction en Wolof de l'Istighfar.",""],
    ["axiru-zaman-en","Axiru zaman-en","آخِرُ الزَّمَانِ","152VpBK4XeSgWJw6XHZkEoZUxtqxUYpaH","Enseignements sur la fin des temps (Version anglaise).",""],
    ["axiru-zaman-fr","Axiru zaman-fr","آخِرُ الزَّمَانِ","1kuh_Xg7Hb-vJRKyeMc1Z_FqI_yhsmUwn","Mise en garde et conseils pour la fin des temps.",""],
    ["ayassa-minilahu","Ayassa Minilahu","أَيَأْسَى مِنَ اللَّهِ","1YFkGs08KtwA0MAYhjUDsp3NMZTkEI_xm","Comment désespérer d'Allah ? Hymne à l'espoir.",""],
    ["baayahtu-xayral-waraa","Baayahtu Xayral-Waraa","بَايَعْتُ خَيْرَ الْوَرَى","1-gh7lPeTIPG_rbpbzAWc5Cr115rSLiNc","J'ai prêté allégeance au Meilleur des Hommes.",""],
    ["bah-bakhaa","Bah bakhaa","بَخْ بَخَا","1BArseXFEMH53eFinM8nPVPQWgXODnn84","Exclamation de joie et de louange (Excellent !).",""],
    ["balsasin","Balsasin","بَلْصَصٍ","1H6Vq8uOC_M0jHwC_Qgl-toCxN1ieR8Yt","Poème aux rimes et rituels spécifiques pour la protection.",""],
    ["barakatul-lezii","Barakatul Lezii","بَرَكَةُ الَّذِي","13C5Os1ntwrxPNb2gBwmcUgVul82iHaJs","La bénédiction de Celui qui... Prière de miséricorde.",""],
    ["bi-bismillaahi-rahmaanir-rahiimi","Bi Bismillaahi Rahmaanir Rahiimi","بِبِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ","1px6vKEL3Jc8raGwqZsQBxMwmKIRV6hA7","Poème de sanctification basé sur la Basmala.",""],
    ["bi-muhammadin-unbihtu","Bi MUHAMMADIN UNBIHTU","بِمُحَمَّدٍ أُنْبِهْتُ","1-YfigoLSpWAcY4QKVNc2T-sY2tQjXZub","Par Muhammad j'ai été averti/éveillé, poème d'éveil.",""],
    ["bi-yawmil-ahadi-safar","Bi yawmil ahadi Safar","بِيَوْمِ الْأَحَدِ صَفَر","1ksg9z-4lv1N1_7xVQBmPz24EXdNQubsL","Évocation d'un dimanche du mois béni de Safar.",""],
    ["bismil-hanliimi","BISMIL HANLIIMI","بِسْمِ الْحَلِيمِ","13zuIs1vkggg1t2AiYGPI3fAplMZ17SMA","Au nom du Clément, poème d'espérance.",""],
    ["bismil-ilaahi-ikfini-1","Bismil ilaahi ikfini 1","بِسْمِ الْإِلَهِ اكْفِنِي","1awpkXaReQVWielEgdpCfaFaF05KmwW6Q","Au nom de Dieu, suffis-moi. Prière de préservation.",""],
    ["bismilaahil-lezi","Bismilaahil lezi","بِسْمِ اللَّهِ الَّذِي","1iiFHZK_i-LIhSBgDVajJUucUm6Z0DRna","Au nom d'Allah qui... Protection et sanctification.",""],
    ["bismillaahi-madaytu-bilaa-waqfin","Bismillaahi madaytu bilaa waqfin","بِسْمِ اللَّهِ مَضَيْتُ بِلَا وَقْفٍ","1EDYSa2Z8280mkoknBj-z9-8oS1m3FdKv","Au nom de Dieu, j'avance sans m'arrêter.",""],
    ["bouchraa-lana","Bouchraa lana","بُشْرَى لَنَا","1nxqJ_d2vFbNGcHra_Tf_kmMap_YSsTna","Bonne nouvelle pour nous, poème de réjouissance spirituelle.",""],
    ["busaaraatin","Busaaraatin","بُشَارَاتٍ","15HxCpQyvj22wq2AMANy2DwoNWaVkADVE","Annonces heureuses et promesses de la grâce divine.",""],
    ["bushraanaa-jamsashunaa","Bushraanaa jamsashunaa","بُشْرَانَا","1fGeXzDvARlIU1TAjFq-CrSNfXdJKp2JG","Notre bonne nouvelle, glorification des bienfaits du Créateur.",""],
    ["calendrier-khassida","Calendrier khassida","تَقْوِيمُ الْقَصَائِدِ","1h9_O7YdPOB4T8SrH-2YQGOUHyKduiJw-","Guide ou recueil organisé chronologiquement.",""],
    ["causeries-aspirant-veridique","Causeries Aspirant Veridique","مَوَاعِظُ الْمُرِيدِ الصَّادِقِ","1UsP0ZBcA9vJhK8cOcDuvoDl8OFXnDtyf","Sermons et conseils destinés à l'aspirant sincère.",""],
    ["chahbanu-bamsachine-kouniyyi","Chahbanu Bamsachine-Kouniyyi","شَعْبَانُ","140jFlHOJIfEXAyBpT3idcSrAxULwh8Ba","Prière et louanges durant le mois de Cha'ban.",""],
    ["chahrou-safar","Chahrou Safar","شَهْرُ صَفَر","1FRX185gdHw8XpEJpFOX5W2vDN5KVIrzI","Poème honorant le mois de Safar, symbole d'exil et de victoire.",""],
    ["diamsachin","Diamsachin","جَمْصَصٍ","1mZ4CFMk9IGINgeUFTRBuO83QbG7RSBnn","Code ou acrostiche mystique fréquemment utilisé dans les prières.",""],
    ["diazboul-murid-fr","Diazboul Murid-fr","جَذْبُ الْمُرِيدِ","1pc2sU5CagvTsyb1snx31RGeEZ7zTblqz","L'attraction du disciple, explication de la quête spirituelle.",""],
    ["dollu-gammu","Dollu gammu","دُلُّو غَمُّ","1kvPwOGzvHmox7_eQJYB0tfaAOZWF2S1f","Chant et panégyrique dédié à la période du Maouloud.",""],
    ["durrussamin","Durrussamin","الْدُّرُّ الثَّمِينُ","1xtd9Sm_OTEJSd8XjctP6GYIx2ypBLyvP","La perle précieuse, joyau de la louange.",""],
    ["faakha-diamiha","Faakha diamiha","فَاقَ جَمِيعَ","1NFXGUSjjXBOc2oQgKsyHcJcQEwFwLjoS","Celui qui a surpassé tous les autres (le Prophète PSL).",""],
    ["faatihatul-kitaab","FAATIHATUL KITAAB","فَاتِحَةُ الْكِتَابِ","1C6yI6bAW8JROo6Faw_zm-TdHKjtg0MUS","Méditation et commentaire sur la Sourate d'ouverture.",""],
    ["faazal-laziina-2","Faazal laziina 2","فَازَ الَّذِينَ","1t_bfaCCQYXoQsgB6hm1oooc64ULb52go","Ils ont réussi ceux qui... Prière sur le salut de l'âme.",""],
    ["faazat-qilaami-1","Faazat qilaami 1","فَازَتْ قِلَامِي","11HRuwMPUdkNfZHPOoPAgl4Ov8eO-1oB2","Ma plume a triomphé dans la louange divine.",""],
    ["fajaa-ani","Fajaa-ani","فَجَاءَنِي","1dbDl8A1tqVcDaJk2d5MSb8tSkj-gQQEw","Et il m'est venu... Récit de grâce et d'inspiration.",""],
    ["farij-bijahil-mustafa","Farij Bijahil Mustafa","فَرِّجْ بِجَاهِ الْمُصْطَفَى","1cK6e69BLSqRgD1nIHW9X1bGgNTme_O62","Dissipe (nos soucis) par la grâce de l'Élu.",""],
    ["farixa-xayrul-bassari","Farixa Xayrul Bassari","فَرِحَ خَيْرُ الْبَشَرِ","1W5yXHXeU9T7cgPm49rTj6DnZDxIg6b9w","La joie du Meilleur des Humains, ode majestueuse.",""],
    ["farixa-xayrul-mursali","Farixa Xayrul-mursali","فَرِحَ خَيْرُ الْمُرْسَلِينَ","1TumkRFmcoEvvALz3jgqeYMfMd8KuSYou","Le Meilleur des Envoyés s'est réjoui.",""],
    ["fathil-fattah-fii-madhil-miftah","Fathil fattah fii madhil miftah","فَتْحُ الْفَتَّاحِ فِي مَدْحِ الْمِفْتَاحِ","1sgWGBYTKDLqg2PyyiqTpWWBaVgijuQQr","L'Ouverture de l'Ouvreur dans la louange de la Clé.",""],
    ["fathoul-ghafar","Fathoul Ghafar","فَتْحُ الْغَفَّارِ","1c_fm4-FKXjZHmHSKG2HtTXsi6gp5mWzu","L'ouverture accordée par le Très-Pardonneur.",""],
    ["fathoul-moukarrimi-ar","Fathoul-Moukarrimi-ar","فَتْحُ الْمُكَرِّمِ","1lJvKn2iFPm3y4QRfTYMJYmkymgQFH5X6","L'ouverture venant du Très-Généreux.",""],
    ["fathulmanan-fr","Fathulmanan-fr","فَتْحُ الْمَنَّانِ","1H5200Rzoh0G38FKFB8w77vsyNJGqx_Me","L'ouverture du Bienfaiteur (version et explication).",""],
    ["fi-cheuhri-ramadaana-haama-alssachin","Fi cheuhri ramadaana haama alssachin","فِي شَهْرِ رَمَضَانَ","1VL9KmWiLZHLrqu-rY-u_c8_Kh9yyTDoz","Poème majestueux dédié aux bénédictions de Ramadan.",""],
    ["fihi-shifa-un-lin-naas","Fihi shifa un-lin naas","فِيهِ شِفَاءٌ لِلنَّاسِ","1CKflpLuDLoZOVFQ7kZ5befPlfILsZHFj","En lui se trouve une guérison pour les gens.",""],
    ["firi-wasful-muriid-shifaatu-shaadiqil-muriid-wolof-fr","FIri Wasful muriid shifaatu shaadiqil muriid wolof-fr","وَصْفُ الْمُرِيدِ / صِفَاتُ الصَّادِقِ الْمُرِيدِ","1hoP4McaFrqGeEmMQnUAvo2Ig9xaqhIgV","Description de l'aspirant sincère (Wolof/Français).",""],
    ["fuzti-felicite-a-toi-marie","Fuzti-Felicite-A-Toi-Marie","فُزْتِ","1yjrC329Ci9G6jf0Vwo80pfKng1U_DRPX","Félicité à toi, poème honorifique à la Vierge Marie (Maryam).",""],
    ["haajat-khassa-idi","Haajat Khassa-idi","حَاجَاتُ قَصَائِدِي","1CruNM8PQf_uefKHlSVReF48w9Y65mfwJ","L'objet de mes poèmes, dévouement exclusif.",""],
    ["haama-saxidnaa-bikaramin-2","Haama Saxidnaa bikaramin 2","هَامَ سَيِّدُنَا بِكَرَمٍ","13oj1f-GiHwezwcezVYyrlbxEcXh3JPRL","Notre Maître a débordé de générosité.",""],
    ["hadaanii-ar","Hadaanii-ar","هَدَانِي","1irfifhaHJvsg6Pbw8tcMEi3_NIGgFNQN","Il m'a guidé, expression de la guidance divine.",""],
    ["hadiyati","Hadiyati","هَدِيَّتِي","16Ph-B0Q8BcNp9nq2yduic83IVIb69VNb","Mon présent, offrande spirituelle par la poésie.",""],
    ["halal-muntakha-qayril-2","Halal muntakha Qayril 2","عَلَى الْمُنْتَقَى خَيْرِ","1F3Z--1eDZyEBGVeche0N48gqz0Z1Lc8H","Sur l'Élu, le meilleur, panégyrique de louanges.",""],
    ["halayka-yaa-moukhtarou","Halayka yaa moukhtarou","عَلَيْكَ يَا مُخْتَارُ","1HpDxV2_2Yqs6fNH5TOQPqJOOgOfxv2Vl","Sur toi, Ô l'Élu, bénédictions et paix éternelles.",""],
    ["hamat-sulayma","Hamat Sulayma","هَامَتْ سُلَيْمَى","1pVH8kos7CQdFWDX3x2im4nub2ytMSqwu","Ode poétique de style classique.",""],
    ["hamidtou-rabi","Hamidtou rabi","حَمِدْتُ رَبِّي","1JucL-uyRnm1wKq4E6InHF0jSs0FkHHeU","J'ai loué mon Seigneur, célébration de la miséricorde.",""],
    ["hamndii-wa-sukri-liman","hamndii wa sukri liman","حَمْدِي وَشُكْرِي لِمَنْ","1n5ulhrvU_SkwIfov7hxQI4sp4NYeg0Hc","Ma louange et ma gratitude à Celui qui...",""],
    ["hasbounallaha-hamdan","Hasbounallaha - Hamdan","حَسْبُنَا اللَّهُ - حَمْدًا","1NFIjBUzus01p6sHs8yP-Xbmp1x_mqLpM","Allah nous suffit, action de grâce infinie.",""],
    ["hazal-hawli","Hazal Hawli","هَذَا الْحَوْلِ","1dH7wpwjL-fBzIQfcoxxGPYlVA3P-1XVK","Prière évoquant la puissance (Hawl) exclusive de Dieu.",""],
    ["hijaabu-daarayni","Hijaabu daarayni","حِجَابُ الدَّارَيْنِ","1yAM-AUXU2u8-YCAfR0feeFpSAwVvUK5R","Le bouclier des deux demeures, protection spirituelle forte.",""],
    ["hisnoul-abrar","Hisnoul Abrar","حِصْنُ الْأَبْرَارِ","1imWLDrVNJrxg7q3msXQYREoyF9qyadaQ","La forteresse des vertueux, poème de préservation.",""],
    ["huqal-bukaa-wolof","Huqal Bukaa wolof","حُقَّ الْبُكَاءُ","1Gmd6lCcQx1uvNfj3QiKrdwR2yGGOXkqe","Il est juste de pleurer (explication en Wolof).",""],
    ["huqqal-bukaa-u","Huqqal Bukaa u","حُقَّ الْبُكَاءُ","1dMgirzkx_AACIL3AybVURybPZBcisV5s","Ode poignante appelant au repentir et aux larmes purificatrices.",""],
    ["huqqal-bukaa-u-en","Huqqal bukaa-u-en","حُقَّ الْبُكَاءُ","140pyP9Kf339f2KN0zJL1ODBEwq7mXPoi","Il est juste de pleurer (Traduction et explications en Anglais).",""],
    ["huqqal-bukaa-u-fr","Huqqal Bukaa-u-fr","حُقَّ الْبُكَاءُ","1xdz94szJyvi8ZzO9DFGpGKsb5OwDS7hU","Il est juste de pleurer (Traduction et explications en Français).",""],
    ["ihdi-jamihaanas-ar","Ihdi jamihaanas Ar","اهْدِ جَمِيعَ النَّاسِ","1jxWqLJ-lQFgUB-eltRLkhKQ6pvCgYG5p","Guide l'humanité toute entière, prière de paix universelle.",""],
    ["ihdi-jamihaanas-wolof","Ihdi jamihaanas wolof","اهْدِ جَمِيعَ النَّاسِ","151MfAmdrCav1bTRFdj0wB9an3BdYWvCY","Guide l'humanité toute entière, invocation universelle (Wolof).",""],
    ["ikhlass-ar","Ikhlass-ar","الْإِخْلَاصُ","1TEIVKm0yQYBxUIIhaQ1haUk5TQaDwXlO","La sincérité du culte, méditation sur la pureté de la foi.",""],
    ["ila-khayrina","Ila khayrina","إِلَى خَيْرِنَا","1mbQni-vf-j-tli213GTV5AEetjZ6ngzw","Vers le meilleur d'entre nous, poème d'orientation prophétique.",""],
    ["ilal-mustafaa","Ilal Mustafaa","إِلَى الْمُصْطَفَى","1L6GR8lphii822D8fRwLei46l30Y-4b7I","Vers l'Élu, l'expression de l'amour prophétique.",""],
    ["ilayka-yaa-rabbal-waraa","Ilayka Yaa RABBAL waraa","إِلَيْكَ يَا رَبَّ الْوَرَى","1UeIyp2fiM35KslcrJdRyMdtwZ5M71Tpk","Vers Toi, Ô Seigneur des créatures, hymne de repentir.",""],
    ["ileyka-yaa-hadiyati","Ileyka Yaa - hadiyati","إِلَيْكَ يَا - هَدِيَّتِي","1UNV8Kypqk-hhrmAHgb2XHSh0OqZ53AzY","Mon présent vers Toi, offrande poétique.",""],
    ["ini-oukhatiboul-nasaaraa","Ini oukhatiboul nasaaraa","إِنِّي أُخَاطِبُ النَّصَارَى","1fi3Vndh9l8N3yqywLjBb3NfF_MMUXw2m","Je m'adresse aux Chrétiens, poème de dialogue et d'exhortation.",""],
    ["innanii-huztu","Innanii Huztu","إِنَّنِي حُزْتُ","1DJP-QNNFtp6LEoWhpYAecvSOyCZyNvDH","J'ai acquis, affirmation des bienfaits spirituels.",""],
    ["inni-aqulu","Inni aqulu","إِنِّي أَقُولُ","1ibWRQChICi-s6lN9k9tC2u18tMJDKvWm","Je dis... expression des certitudes de la foi.",""],
    ["iqra-wa-raboukal-akramou","Iqra Wa raboukal Akramou","اقْرَأْ وَرَبُّكَ الْأَكْرَمُ","1aw8hFI4Q5BPc_IzYy2W32aIi4lWdBBnQ","Lis, et ton Seigneur est le Plus Généreux.",""],
    ["irwaawun-naddym-ar","Irwaawun naddym ar","إِرْوَاءُ النَّدِيمِ","18oiNq2wEx_YSySYpN8VhKU8s0XwXJCf9","L'abreuvoir du commensal, texte arabe.",""],
    ["jaalibatul-maraaxib","Jaalibatul Maraaxib","جَالِبَةُ الْمَرَاغِبِ","1a4VKQesdxTIpO1qTm-qT6EMupoKcSVpT","Celle qui attire les grâces et les bienfaits désirés.",""],
    ["jalibatul-burur","jalibatul burur","جَالِبَةُ الْبُرُورِ","1uDKE4PShXmeWYWRTOH4LSXfrIGKjyMkM","Celle qui attire la piété et les bonnes actions.",""],
    ["jalibatul-massarah","jalibatul massarah","جَالِبَةُ الْمَسَرَّةِ","1kIWPx43PH3yDiiXXgWH_gpETBjEUIzmn","Celle qui attire la joie et la félicité.",""],
    ["janatul-hajilah","janatul hajilah","جَنَّةُ الْعَاجِلَةِ","1CkZj3kQEqddGabJpw2OU_bgVrabQ4Uk2","Le paradis terrestre, poème de consolation.",""],
    ["jawartu-en","Jawartu-En","جَاوَرْتُ","1U6rodNimdulCBAyi-BVUq8a2RYwTALQM","J'ai été le voisin de... poème exprimant la proximité spirituelle.",""],
    ["jazbatus-sikhaar-ar","Jazbatus-Sikhaar-ar","جَذْبَةُ الصِّغَارِ","1je1NAneNelJwxUOdfkK3_LtZBpwFJUD5","L'attirance des jeunes coeurs vers la droiture.",""],
    ["jazbou-fr","Jazbou-fr","جَذْبُ الْقُلُوبِ","1jjCfO6r1L2jEw2GJitsj_RpSll_nSjgW","L'attirance des coeurs (traduction française).",""],
    ["jazbul-quloob-ar","Jazbul Quloob Ar","جَذْبُ الْقُلُوبِ","1sd0ZrFOdPyAuVgAeUc1Dwv8Tiz-bSRjP","L'attirance des cœurs, célèbre panégyrique dédié au Prophète (PSL).",""],
    ["jotaayu-texe-p1","Jotaayu Texe P1","مَجَالِسُ النَّجَاةِ ١","10VzKzhBnBJsBMNNbvrxmwOKbVhCCXE97","Les assises de la félicité, enseignements du Mouridisme.","Serigne Aladji MBACKE"],
    ["jotaayu-texe-p1-2","Jotaayu Texe P1","مَجَالِسُ النَّجَاةِ ١","1y5_K0e1atVQMNcfarokcKdS9paEMAImS","Épisode ou partie des assises de l'élévation spirituelle.","Serigne Aladji MBACKE"],
    ["karamu-mankhalakha-ar","Karamu-ManKhalakha-ar","كَرَمُ مَنْ خَلَقَ","1-usvY8f1CvDYkJPKbzmPwUy1-DEMOeRf","La noblesse du Créateur.",""],
    ["kawine-liyal","Kawine liyal","كَوِّنْ لِيَ","1UbyOu-HLRc3_fMb6VynpdkO0tTAgJRZW","Rends pour moi... Prière pour un destin favorable.",""],
    ["kazu-rajab","Kazu RAJAB","كَزُ رَجَب","1cPjICq4K5UqJg8IPKgc4gosxLPNkVpo2","L'anniversaire glorieux célébré le 27 Rajab.",""],
    ["khaatimatu-munaajaatii","Khaatimatu Munaajaatii","خَاتِمَةُ مُنَاجَاتِي","1Wurf7UDTuO4SL9KYkTP3Uv-bTv6GRksz","Le sceau de mes apartés avec Dieu, ultime supplique.",""],
    ["khalo-liyarkane","Khalo liyarkane","قَالُوا لِيَرْكَنَ","1Xynxp93jqUNsAJ1W5iYFHjMMHVr5B_dp","Ils ont dit de se plier, poème sur la résistance par la foi.",""],
    ["khamsatou-ridjal","Khamsatou Ridjal","خَمْسَةُ رِجَالٍ","1bHdjC0dVJyoyNJixZFJNcpr1sCp-vV1P","Les cinq hommes illustres de la foi.",""],
    ["khassida-mawlidi-nabii","Khassida Mawlidi Nabii","قَصِيدَةُ مَوْلِدِ النَّبِيِّ","1wlzbGnIic9jdQaO_yqrIWMC__cHmxkYh","Poème grandiose célébrant la naissance du Prophète (Mawlid).",""],
    ["khassida-ramadane","Khassida ramadane","قَصِيدَةُ رَمَضَانَ","1raRK4SnTsl24a9DlshtYFZ2WADWigu3h","Hymne à la sacralité du mois de Ramadan.",""],
    ["khassida-taani","Khassida taani","قَصِيدَتَانِ","1XMdl1QWD21xnY9dntOtrb3Et7t5ex3Sk","Deux poèmes entrelacés de louange.",""],
    ["khatimatu-munajati-fr","Khatimatu-Munajati-fr","خَاتِمَةُ مُنَاجَاتِي","1Upg7mj0kRj6JZts2GaSiFcXMyEaNjAT8","La conclusion de mes prières secrètes (Traduction FR).",""],
    ["khatmoul-khur-ane","Khatmoul khur-ane","خَتْمُ الْقُرْآنِ","1cLmESsO52MKFYLtnAKZ10VwZeMYziD1L","Prière récitée à la clôture de la lecture du Saint Coran.",""],
    ["khoulnaa-yaa-naarou-kunii","Khoulnaa yaa naarou kunii","قُلْنَا يَا نَارُ كُونِي","1M_cfDfjL8CuEUS_40_Se5W0mVEQ04wOV","Nous dîmes : Ô feu, sois une fraîcheur. Méditation sur la préservation d'Abraham.",""],
    ["khoutbay-aldjuma-yi","Khoutbay Aldjuma yi","خُطْبَةُ الْجُمُعَةِ","1COCrqnmFW41RPVK9nHEax84Ugk2XKixD","Sermons de la prière canonique du Vendredi.",""],
    ["kufitu","Kufitu","كُفِيتُ","1pdyOeANTBYSwQpFUGN9DY-8hi0rBf-Xt","J'ai été préservé, poème de protection divine.",""],
    ["kun-kaatiman","Kun Kaatiman","كُنْ كَاتِمًا","17p9ca8xbc2wOwXPuEcuQK-Bg1rlqN87P","Sois discret, poème sur la sagesse du silence et de la retenue.",""],
    ["kun-kaatiman-fr","Kun-Kaatiman-fr","كُنْ كَاتِمًا","14iFFUkLDmd22jNYi6GW_lCCdLCpLsbA8","Traduction et sagesse du poème sur le silence.",""],
    ["la-ilaha-ila-anta-subhaanaka-inni-kuntu-mina-zaalimine","La ilaha ila anta subhaanaka inni kuntu mina-zaalimine","لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ","1-8eKilIc3WdKknaONXd49qq_3DILMu8M","Prière de Jonas, l'invocation de repentir par excellence.",""],
    ["la-shaka-xassida","La shaka xassida","لَا شَكَّ","1bRyFJkNPmT3YJJLP5e9ZFRsjzzm1EmzB","Sans aucun doute, expression de la certitude absolue.",""],
    ["laa-rayba-fiixi","Laa rayba fiixi","لَا رَيْبَ فِيهِ","1v_XU_0R0Z7ZPa_o6TclwnCCHYYlr33oC","Où il n'y a point de doute, ode à la foi ferme.",""],
    ["laa-taxaf","Laa taxaf.","لَا تَخَفْ","12H0lQwmXFwLBnc6ODXeT9cEBRuvOgUDP","N'aies pas peur, appel au courage et à la confiance en Dieu.",""],
    ["laa-yaatuuna","Laa yaatuuna","لَا يَأْتُونَ","1bY897E3l76YgK5UkMflFsVHouPr5fKiu","Ils ne viendront pas à bout... poème de l'invincibilité divine.",""],
    ["laa-zamtu-qabla-yawmii","Laa zamtu qabla yawmii","لَازَمْتُ قَبْلَ يَوْمِي","1r8hopRxLNhW0ngysPTGtBgwaKKpExlGY","Je me suis attaché avant mon jour... prière de prévoyance spirituelle.",""],
    ["lahum-daaru-salaam","Lahum daaru salaam","لَهُمْ دَارُ السَّلَامِ","1bd-dbg3oqb4vEDk-YZh5VTE3IQAXZm_N","À eux la demeure de la Paix, évocation du Paradis.",""],
    ["lainchakartum-ar","Lainchakartum-ar","لَئِنْ شَكَرْتُمْ","1t2eR81P88rQb05P4xR-f5fMUTVxYNEFe","Si vous êtes reconnaissants... hymne sur l'augmentation des grâces.",""],
    ["lam-yabdu-mislul-mustafaa","Lam yabdu Mislul MUSTAFAA","لَمْ يَبْدُ مِثْلُ الْمُصْطَفَى","1H3Z-lUhMEvzflXriY3cQu-somrf809Re","Nul n'est apparu tel que l'Élu, éloge incomparable du Prophète.",""],
    ["lam-yabdou-ar","Lam-yabdou-ar","لَمْ يَبْدُ","1gkGEiSIWvFt2ed5Jb7eHiHa0z2htyjm6","Poème majestueux sur l'unicité de la perfection prophétique.",""],
    ["layantahi","Layantahi","لَا يَنْتَهِي","1xMxI7mS-HBSnaW9u1jK0LSenDtUrhet9","Ce qui ne s'épuise jamais, sur les trésors de Dieu.",""],
    ["laylatoul-khadr","Laylatoul khadr","لَيْلَةُ الْقَدْرِ","1GQ6U42NCJZ939b-rFGwzHgyEQoqwGI1L","La nuit du Destin, poème célébrant sa noblesse.",""],
    ["laylatul-qadr-xayrun-min-alfi-saxrin","Laylatul qadr xayrun min alfi saxrin","لَيْلَةُ الْقَدْرِ خَيْرٌ مِنْ أَلْفِ شَهْرٍ","1L6sLCKCUc1hynWtU7BPMwsnDo28HSwJp","La Nuit du Destin est meilleure que mille mois.",""],
    ["laysal-birru-ar","Laysal-birru-ar","لَيْسَ الْبِرَّ","1LDYV2X4SUUGAm4dbUPbXVkA91WRGYdTy","La vraie piété, enseignement tiré du verset coranique.",""],
    ["lil-moustapha","Lil Moustapha","لِلْمُصْطَفَى","1SCWgFBrvzIrIqWPeABTHxG2R5u81AFBI","Dédié à l'Élu, pur panégyrique de louange.",""],
    ["lil-mustafa-nawaytuma-yujadidu","Lil Mustafa nawaytuma yujadidu","لِلْمُصْطَفَى نَوَيْتُ مَا يُجَدِّدُ","1PGsDCGHzQSBLfqFr2ipqgcjqnf_zEncr","Pour l'Élu, j'ai l'intention d'une louange qui renouvelle.",""],
    ["lil-lahi-rabil-leuzi","Lil-Lahi Rabil leuzi","لِلَّهِ رَبِّ الَّذِي","1ByGeAFFwNjtCaBVOnR5XaTMIVZ4UmWcR","À Dieu, Seigneur qui... déclaration d'humilité.",""],
    ["lillaahi-saxru-ramadaana","LILLAAHI Saxru ramadaana","لِلَّهِ شَهْرُ رَمَضَانَ","1iI3MrxEOV2y8APvb7JPDNcAlsIJgafoH","À Dieu appartient le mois de Ramadan.",""],
    ["lillahi-kouli-yati","Lillahi kouli yati","لِلَّهِ كُلِّيَّتِي","1g07BHzMxNTgOwMwbOB0as1SFvf7xgca5","Mon entièreté appartient à Dieu, don de soi spirituel.",""],
    ["limaahin-bachiirin","Limaahin Bachiirin","لِمَاحٍ بَشِيرٍ","1xX219dnUQSBLi3v_2AFJFJO2AXVHBSJU","Pour Celui qui efface les péchés et porte la bonne nouvelle.",""],
    ["lirabbin-ghaforin","Lirabbin Ghaforin","لِرَبٍّ غَفُورٍ","1hmZZY2Z4YOX3lTCIpaFZFAqD3KwsNX68","À un Seigneur Clément, supplique de pardon.",""],
    ["liyan-khaada","Liyan khaada","لِيَنْقَادَ","1Ki0DV6r-_AYA6E8srKW6zVHQb_bn5A-S","Afin qu'il se soumette, poème d'orientation divine.",""],
    ["mabdaaloul-khira-aati","Mabdaaloul khira-aati","مَبْدَأُ الْقِرَاءَاتِ","1pRh6jGITSvcsRbmIbsGm1LsOPl-n_Hnl","Le principe des lectures, éloge des saintes Écritures.",""],
    ["madahtou","Madahtou","مَدَحْتُ","1d7-mxlQJZSd-424v8lLW3LdPmLCTKCPK","J'ai fait les louanges, poème de dévotion intense.",""],
    ["madahtu","Madahtu","مَدَحْتُ","1Hz4taBXkfWUARtn7r3gUwRwHCf-isPOG","J'ai loué le Prophète, ode magnifique au bien-aimé.",""],
    ["madal-xabiru-lissanu-chukri","Madal Xabiru Lissanu Chukri","مَدَّ الْخَبِيرُ لِسَانَ الشُّكْرِ","1SvAJwqYA1ykcdpC7aIQr9Iwnt04SELaT","L'Expert m'a accordé la langue de la gratitude.",""],
    ["madaytu-wa-sarahtu-shahbaana-bisriya","Madaytu wa sarahtu shahbaana bisriya","مَضَيْتُ وَسَرَيْتُ شَعْبَانَ","1Uwld_KiK-tMG2LXiXnBADqDAk29D50jX","Poème de voyage nocturne et d'élévation durant Cha'ban.",""],
    ["madhu-nabiyil-muntaqa","Madhu Nabiyil Muntaqa","مَدْحُ النَّبِيِّ الْمُنْتَقَى","1SuE0RtHTQFtGykuhfRHdo7B9Ivqv6spA","La louange du Prophète, l'Élu, par excellence.",""],
    ["mafatihul-bichri-ar","Mafatihul Bichri ar","مَفَاتِيحُ الْبِشْرِ","1ClbW_SHj7ACJAWSgCsslW3BClf8vxYlQ","Les clés de la bonne nouvelle et de la joie.",""],
    ["mafatikhoul-jinane-ar","Mafatikhoul Jinane Ar","مَفَاتِيحُ الْجِنَانِ","1pd1Qrl9g7pH_4I_84kPON4edwVThHKqh","Les clés du paradis, recueil fondamental de prières et de recommandations.",""],
    ["maghaliqu-niraan","Maghaliqu niraan","مَغَالِقُ النِّيرَانِ","1UBbEjst_RskS7hsqaPcsrZidPHcq10Kh","Les verrous des enfers, invocations protectrices.",""],
    ["maghaliun-niiraan-wa-mafatikhoul-jinaan-fr","Maghaliun niiraan wa mafatikhoul jinaan fr","مَغَالِقُ النِّيرَانِ وَمَفَاتِيحُ الْجِنَانِ","1JzubNH6SBg5csRbfGv8RK0UJWIASfUKh","Les verrous des enfers et les clés des paradis (version française).",""],
    ["maha-huyobi","Maha huyobi","مَحَا عُيُوبِي","10XbYtTHnQ8Mq6pVz3wA64_q18DJFAn3I","Il a effacé mes défauts, ode sur le pardon de Dieu.",""],
    ["mahawta","Mahawta","مَحَوْتَ","1i0St-0w5aYS8L-4vxc9iUFeaemR9j73T","Tu as effacé, louange adressée à l'Absoluteur des fautes.",""],
    ["majmahou-noreyni","Majmahou Noreyni","مَجْمَعُ النُّورَيْنِ","188PbZLazpNEPCgVk9_iO9mx-gfdHLlDO","Le confluent des deux lumières, joyau de la littérature mouride.",""],
    ["majmouatou-moubaraka","Majmouatou Moubaraka","الْمَجْمُوعَةُ الْمُبَارَكَةُ","1JNayEQOvKJq6Mfi6_xqwUMvElU5HFclp","Le recueil béni de prières et recommandations.",""],
    ["makhal-moustapha-hannile","Makhal-Moustapha Hannile","مَعَ الْمُصْطَفَى","1mBfrX2F4bYsC9L6UfEpVrBsVXO27etZR","En compagnie de l'Élu, panégyrique affectueux.",""],
    ["malaktou-ahmada-midaadi-wakhilam","Malaktou ahmada midaadi wakhilam","مَلَكْتُ أَحْمَدَ مِدَادِي","1_3pePXV05lWILPcU7FoVOaNYx6CCONmA","J'ai pris l'encre de Ahmad, métaphore poétique.",""],
    ["man-jaa-a-bil-hasanati","Man Jaa a Bil Hasanati","مَنْ جَاءَ بِالْحَسَنَةِ","1BCRBj0LlwlQJvXi35aGXV0zC11xC-JEH","Quiconque vient avec une bonne action...",""],
    ["manezanani","Manezanani","مَنْ ظَنَّنِي","1WAuJ7tcUiE11uU0lesA6yFuWBZtCej3w","Celui qui me croit... Poème de clarification spirituelle.",""],
    ["maraamiya-indal-laahi","Maraamiya Indal LAAHI","مَرَامِي عِنْدَ اللَّهِ","1vqkUveiPpDSc_Wt18h3YymdUAgIXp3w7","Mon aspiration suprême auprès d'Allah.",""],
    ["mashrabu-saafi","Mashrabu Saafi","الْمَشْرَبُ الصَّافِي","14pFUxT31zy6RD7trkBHOmvkBLJ6n7a_c","La source pure, l'abreuvoir spirituel sans tache.",""],
    ["massaatikul-jinaan-fr","Massaatikul Jinaan fr","مَسَالِكُ الْجِنَانِ","1a_Zm87OT8VL8tZ180nty-NRm6-eifiqy","Les itinéraires des Paradis, l'encyclopédie du soufisme (version française).",""],
    ["massalik","Massalik","مَسَالِكُ الْجِنَانِ","1TOPnRBw6O7GfWO5lQPOhWz9eg3gnxb4k","Massalikul Jinaan, l'ouvrage majeur du soufisme mouride.",""],
    ["matlaboul-fawzayni-fr","Matlaboul fawzayni-fr","مَطْلَبُ الْفَوْزَيْنِ","16Hd3h4vkyTvkV0nbgU2BCWab_-NVW67a","La quête du bonheur (Traduction française).",""],
    ["matlaboul-fawzeyni-ar","Matlaboul Fawzeyni Ar","مَطْلَبُ الْفَوْزَيْنِ","1FVAdIRGOzOZW7xipZstsgCGFqwE5I1wl","La quête du bonheur dans les deux mondes, panégyrique fondamental.",""],
    ["matlabu-taqabul","matlabu taqabul","مَطْلَبُ التَّقَبُّلِ","1qZ8u1uZ728oA2e6r2Zim0Ut51m37sDAp","La demande de l'acceptation divine des œuvres.",""],
    ["matlabul-fawzeyni","Matlabul Fawzeyni","مَطْلَبُ الْفَوْزَيْنِ","1IevQZdaXY1SdBrsBAonn3MAyZ1y9Wz7w","Le viatique des deux mondes, prière inestimable.",""],
    ["matlabul-hafiyah","Matlabul Hafiyah","مَطْلَبُ الْعَافِيَةِ","1CNZ_ikYgLuHpEvFsVt5si8a5YKkb4dI3","La quête de la santé et du salut complet.",""],
    ["matlabul-magharil-asna","Matlabul Magharil Asna","مَطْلَبُ الْمَغَارِ الْأَسْنَى","1zLtmXDCHsKpu4gAkHjg4zE2MlrTgw_CC","La quête des stations les plus sublimes.",""],
    ["matlabus-shifa-i-fr","Matlabus Shifa-i fr ","مَطْلَبُ الشِّفَاءِ","1OFpkN6TBFCIvVjhcbOrKwyahuZH0rrU6","La quête de la guérison (Traduction française).",""],
    ["matlabush-shifa-i","Matlabush Shifa-i","مَطْلَبُ الشِّفَاءِ","15yTl0SXGy89qXhKh03SVYczXLcYD7Z8g","L'invocation pour obtenir la guérison divine absolue.",""],
    ["mawahibal-khadiimi","Mawahibal khadiimi","مَوَاهِبُ الْخَدِيمِ","1LMAfcyCnctZq1eZUmcjH5dc9FpQgPkJP","Les dons accordés au Serviteur (Khadim).",""],
    ["mawahibou-nafih-fr","Mawahibou nafih fr","مَوَاهِبُ النَّافِعِ","1ZdZ_Dx3fuFoM-hQCfB6rERgMqH6ITOse","Les dons de Celui qui profite (Traduction française).",""],
    ["mawahibou-nafih-ar","Mawahibou nafih-ar","مَوَاهِبُ النَّافِعِ","15BeL6aKGbYwkIg75P0WteoPp9S-2gQ-Y","Louange magnifiant les dons de Celui qui accorde tout profit.",""],
    ["mawahibou-r-rahmaane","Mawahibou-r Rahmaane","مَوَاهِبُ الرَّحْمَنِ","1RL2pSoHtv-ghE5rBn8wGmq7cmlhIMrOM","Les dons infinis du Très-Miséricordieux.",""],
    ["mawahiboul-xuduus-ar","Mawahiboul Xuduus-ar","مَوَاهِبُ الْقُدُّوسِ","19uXSfKjQE4A_pY_acDouWVBwKo3z8v0x","Les dons sacrés du Très-Saint.",""],
    ["mawahiboul-xuduus-fr","Mawahiboul Xuduus-fr","مَوَاهِبُ الْقُدُّوسِ","1X-M0PRifR-yVighBQVdFOo3pzaHqwpiy","Les dons du Très-Saint (Traduction française).",""],
    ["mawahibu-nafih-ar-1","Mawahibu nafih-ar-1","مَوَاهِبُ النَّافِعِ","1s8-KcoFD89SZf2DSEQifDenIrJfbWwo6","Les dons de Celui qui est Utile (Dieu).",""],
    ["midaadi-fr","Midaadi fr","مِدَادِي","1fDkJpvUe3qpnSFvMo0SJHYFlRz3P-Ugf","Poème sur l'encre de l'éloge divin (Explication en français).",""],
    ["midadi","Midadi","مِدَادِي","1qP6z31dCZeDiBVYguCuk-XBOV3toonPn","Poème mystique sur l'encre divine et la louange.",""],
    ["miftahul-huyob","Miftahul Huyob","مِفْتَاحُ الْغُيُوبِ","1spgMMdibUWXRSRXpeAmd79hdu_apq4bc","La clé de l'Inconnaissable (du mystère).","Serigne Alaadji MBACKE"],
    ["miftahun-nasri-ar","Miftahun nasri ar","مِفْتَاحُ النَّصْرِ","1SfdkA6JASrcxjz8zj7Qd1ll9Np0GYspn","La clé de la victoire, puissante prière d'ouverture.",""],
    ["miikaayil","Miikaayil","مِيكَائِيل","1M8C1uCDapBocW4OqF9Ptv8CzStX8YiuS","L'archange Mikhaïl, ode invoquant les grâces célestes.",""],
    ["miim-raa-shiin","Miim Raa Shiin","م ر ش","1uZMfmjNZxA5lrVIsdiTZpExy5uyoBbTQ","Poème mystique centré sur des lettres saintes.",""],
    ["mimiya-ar","Mimiya ar","مِيمِيَّةُ","1fIrZEXjT1ZFO2FJjxs378xm1FnVgyyDI","Panégyrique dont les vers se terminent par la lettre Mim.",""],
    ["min-saxri-ramadaana-hanmi-jamsasin","Min Saxri ramadaana hanmi jamsasin..","مِنْ شَهْرِ رَمَضَانَ","1W1O3q0CqZdXUuowX39a73Hiudj7nGlbY","Le grand don du mois de Ramadan.",""],
    ["min-shawwaali-hanmi-jamsasin","Min Shawwaali hanmi jamsasin","مِنْ شَوَّالٍ","1FfzH4oLUl31eyEoxa6cl0qEFYS9ECuHf","Grâce divine descendue en ce mois de Shawwal.",""],
    ["minal-ilahi-bi-rassouli","Minal ilahi bi rassouli","مِنَ الْإِلَهِ بِالرَّسُولِ","1s4asTjU6y35J4bxPpswyjvRO5lW7k9Um","De par Dieu, à travers le Messager.",""],
    ["minal-lawhil-mahfuuzi","Minal lawhil Mahfuuzi","مِنَ اللَّوْحِ الْمَحْفُوظِ","1XTZeTC5Q_mlQHVr8L70gJRJEQ_SK6Ix6","Depuis la Table Gardée, sur la pré-éternité des décrets divins.",""],
    ["minal-haqqi","Minal-Haqqi","مِنَ الْحَقِّ","1Jzr06GlElsftZu5GYf0r3T595i2V7Xbc","Émanant de La Vérité, poème de guidée absolue.",""],
    ["minal-khadiimi-ilal-mahdumi-miizaanu","Minal-Khadiimi ilal Mahdumi-miizaanu","مِنَ الْخَدِيمِ إِلَى الْمَخْدُومِ","1IivAM_EMu2koD69XI5aYv-w9Y1gj_Cqd","Du Serviteur au Maître Servi.",""],
    ["minanul-baaqil-qadiim","Minanul Baaqil Qadiim","مِنَنُ الْبَاقِي الْقَدِيمِ","1JWWx3xy_dmyZl72BEEQ9ueUpRSBVQDE3","Les faveurs de l'Éternel et l'Ancien des jours.",""],
    ["moukhadimatoul-amdah","Moukhadimatoul Amdah","مُقَدِّمَةُ الْأَمْدَاحِ","1dOPqcYcDM2xDBYDImvX3TrVQE0E98eno","L'introduction aux panégyriques de louanges prophétiques.",""],
    ["mudda-xayaatii","Mudda Xayaatii","مُدَّةَ حَيَاتِي","1Dy5LGlaa9wPtEvqbZ4maJlXyTfq7-pCp","Tant que je vivrai, hymne de constance.",""],
    ["muhadimatul-qidmah-ar","Muhadimatul qidmah ar","مُقَدِّمَةُ الْخِدْمَةِ","1WVYn1c3H8N1cweoei5pqlHG6TY3jALrc","Le préambule au service, principes fondateurs du mouridisme.",""],
    ["muhamadun-rasul","Muhamadun Rasul","مُحَمَّدٌ رَسُولُ","1lEl7Kdjq8bdHgcJNlwMtAE98cqGIF2XZ","Muhammad est l'Envoyé, l'affirmation sublime du Message.",""],
    ["muhammadikal-jamiil","Muhammadikal Jamiil","مُحَمَّدِكَ الْجَمِيلِ","1nXMsDFbMKwyhRYMI9cF4j6tLQxy1Ru-9","Ton si beau Muhammad, ode d'une profonde beauté.",""],
    ["mumittu-kuffa","Mumittu kuffa","مُمِيتُ الْكُفَّارِ","1upzTepbybgUhSi9B2VL9WkXZt9SOyvSN","Celui qui anéantit la mécréance, poème de triomphe de la foi.",""],
    ["muqadammatul-xidma-ar","Muqadammatul xidma Ar","مُقَدِّمَةُ الْخِدْمَةِ","19cdMbakz1xfh-KZhaq8yj3DrBBXJPpYX","Préface au service de l'Islam (Texte en arabe).",""],
    ["nafahanii","Nafahanii","نَفَعَنِي","1U2DkAjwMoh4pdCEzeA5Chm5AU93YBYD_","Il m'a été utile, reconnaissance des bienfaits de Dieu.",""],
    ["nuru","Nuru","نُورُ","13DNNkCq4thKpp92buSZPYkwji8CeUQyd","Lumière, célébration de l'illumination spirituelle.",""],
    ["oubikhtou","Oubikhtou","أُبِحْتُ","1zImMbRHXGqXgE5VuwwK0wTxeyNsxRzqQ","J'ai été gracié et honoré.",""],
    ["qasida-taani-ar","Qasida-Taani-ar","قَصِيدَتَانِ","12B7R9WyxuFyTkAngI8CUmuQKsv5jqglW","Poème de haute portée mystique.",""],
    ["ra-i-ya","Ra-i-Ya","رَائِيَّةُ","1y3jkd8xLkw7twqGMYqbEX48cQQXoJD1Q","Poème se terminant par la lettre Raa.",""],
    ["rabana-taqabal-minna","Rabana taqabal minna","رَبَّنَا تَقَبَّلْ مِنَّا","1ei0c6N0Q-E23Hl0Rlxzx6WcrNqAbcWWU","Ô notre Seigneur, accepte de nous, prière d'exaucement.","Serigne Abdu Rahman Mbacke"],
    ["rabbi-kariimine","Rabbi Kariimine","رَبِّ كَرِيمٍ","1E_hV16OFHBKjubVIfjCZ0jrL5fvq_jG8","Mon Seigneur Généreux, appel à la clémence.",""],
    ["rabbii-bimaa-yasrahu","Rabbii bimaa yasrahu","رَبِّي بِمَا يَشْرَحُ","1vncfqmRKsK5ZX4dwnhjZjMZ8AIdO_joB","Mon Seigneur par ce qui réjouit et élargit le cœur.",""],
    ["rabiihul-awwalu-liya","Rabiihul awwalu liya","رَبِيعُ الْأَوَّلِ لِي","1oz0KVs58QZEUiQTcyXrJlkoFpBBSvuzn","Poème dédié au mois béni de la naissance du Prophète (Rabi' al-Awwal).",""],
    ["rabiya-ahmadou","Rabiya-ahmadou","رَبِّي أَحْمَدُ","1QUFcy_kBWeCot4b-8UPcw-F8Ob9ZtRQk","Mon Seigneur, je loue. Chant de reconnaissance éternelle.",""],
    ["radiitu","Radiitu","رَضِيتُ","1iRimWQQ4WKs2wLEkiKJowDNBWU0R9NYt","J'agrée, poème sur l'agrément absolu des décrets divins.",""],
    ["rafahnaa-ar","Rafahnaa-ar","رَفَعْنَا","1GuJumM1pfDYoQ2quywqwGCErjNdBgeIl","Nous avons élevé, méditation sur l'élévation du nom prophétique.",""],
    ["rafakhna-liyankhada-ar","Rafakhna liyankhada-Ar","رَفَعْنَا لِيَنْقَادَ","1zcPBhg1n1aUkVQwNwP-w8dgbNKFBfMNV","Élévation pour la soumission parfaite.",""],
    ["rajab","Rajab","رَجَب","104WamoPSOvn9SAiVE0p6rb1d0tVY2AhU","Ode aux bénédictions du mois sacré de Rajab.",""],
    ["rajab-rabistajib","Rajab rabistajib","رَجَب رَبِّ اسْتَجِبْ","1dQncnIcLjtKHNVyIWbIqV0OHR2f49MpA","Seigneur, exauce-nous en ce mois de Rajab.",""],
    ["rajab-saxrul-akrami","Rajab Saxrul Akrami","رَجَبُ شَهْرُ الْأَكْرَمِ","19mnFPh2qnALEETNajp2JEHMzzduvFoh7","Rajab, le mois du Très Généreux.",""],
    ["ramadaanu-hanmi-balsasin","Ramadaanu Hanmi balsasin","رَمَضَانُ عَمِّ","1bmfp3MUZ4dcaqY4gSnhTwVIwfTzTvJz6","Poème de célébration du mois de jeûne et de clémence.",""],
    ["receuil-khassaides-1","Receuil Khassaides-1","مَجْمُوعَةُ قَصَائِدَ ١","1vPwaJGwUHkBqvlfPxOYuO4mTSSOCyqZY","Un majestueux recueil de panégyriques.",""],
    ["receuil-khassaides-2","Receuil Khassaides-2","مَجْمُوعَةُ قَصَائِدَ ٢","1YV-yTBYwNJnLHeYua-OCgMTfZzcKcr3i","Second tome du recueil des éloges écrits par le Cheikh.",""],
    ["recueil-sermons","Recueil Sermons","مَجْمُوعَةُ خُطَبٍ","1xKjw6fF5wnNFae9t8sV0UjZpeN14HCXH","Recueil des sermons spirituels (Khutbas).","Serigne Saalihu MBACKE"],
    ["recueils-sermons","Recueils Sermons","مَجْمُوعَةُ خُطَبٍ","1-s8kR_7Fyfxh7IIP5g9zOt3r3jXI22VL","Précieux recueil de sermons (Khutbas).","Cheikh Moustapha MBACKE"],
    ["rumnaa-shukur","Rumnaa shukur","رُمْنَا شُكْرًا","1ppTirxzVydozxgWD9xLsUlF8xjEyL13u","Nous avons visé la gratitude suprême.",""],
    ["sabhun-taqii-ar","Sabhun Taqii-ar","سَبْحُ التَّقِيِّ","1poV_KWSTHsUbRtFz9PRQxvWjLqcXKD5E","Le cheminement du Pieux, adoration profonde.",""],
    ["sabhun-taqii-fr","Sabhun Taqii-fr","سَبْحُ التَّقِيِّ","17yExITd7_fxLOWhU7n1wRATEw2oJgLrs","La marche spirituelle du saint homme (Version française).",""],
    ["safaa-ul-qalbi","Safaa ul qalbi","صَفَاءُ الْقَلْبِ","1dyhq-B7QyzB_nCkwCta3YN_7HNEn1rhM","La pureté du cœur, poème sur la purification intérieure.",""],
    ["safar-safar-safar","Safar Safar Safar","صَفَر صَفَر صَفَر","1snI5Li77cYezTEx4uG4vFz1eKHNhNDtA","Triple évocation pour magnifier le mois de l'exil triomphal.",""],
    ["safar-saffaa","Safar Saffaa","صَفَر صَفَا","19tjDUoSc0Z1Rfj13ttmISi2yQEKB-MVl","Safar a purifié... Poème honorant les grâces de ce mois.",""],
    ["safar-salaatu","Safar salaatu","صَفَر صَلَاةُ","1un_v1RDG7TqTN7nVsRCX9mY8ISeGlrbM","Les prières ferventes du mois de Safar.",""],
    ["safaru-bamsashine-junatun-manuscrit-s-abdu-rahman-mbacke","Safaru Bamsashine Junatun manuscrit S Abdu Rahman MBACKE","صَفَر جُنَّةٌ","1evt-jKUyi1wUH0KA0uieUSqVv6sb178R","Safar est un bouclier, poème de protection.",""],
    ["safaru-hamsachine","Safaru Hamsachine","صَفَر خَمْسَةُ","165BLF-YOHxstp0tU-WF1QNuqoXdUA5n2","Prière et célébration rattachées au mois de Safar.",""],
    ["sahadatu-tulaab","sahadatu tulaab","سَعَادَةُ الطُّلَّابِ","1pWYq_LGDrLrKbxJGn4_bOUa7E16umPf6","Le bonheur des étudiants (aspirants spirituels).",""],
    ["sahbaan","Sahbaan","شَعْبَانُ","1A7qf7Nw5qOAGR8pBeVMGGSbXi1D9ZirS","Poème de sanctification et de prières pour le mois de Cha'ban.",""],
    ["sahbaan-shakartu","Sahbaan-Shakartu","شَعْبَانُ شَكَرْتُ","16qDUSaVftCZhuJiXKhfGfuadEGmO6lKd","Cha'ban, j'ai rendu grâce, louange lors du 8e mois lunaire.",""],
    ["sakuuru-raafihu-ar","Sakuuru Raafihu Ar","شَكُورٌ رَافِعٌ","1tYqKLBzVRQw8K7Afh7X2ff1-r76tSbQj","Prière appelant les attributs divins de Gratitude et d'Élévation.",""],
    ["sakuuru-raafihu-wolof","Sakuuru Raafihu Wolof","شَكُورٌ رَافِعٌ","1a8ohanZTXbb2OEzfl_kvgKgUFsQ8q7tZ","Le Très-Reconnaissant, l'Élévateur (Commentaire Wolof).",""],
    ["salaatu-rahiimin","Salaatu Rahiimin","صَلَاةُ رَحِيمٍ","10ffH7fgwosaIyR3MNnNfrZgCTAjdcRlZ","La prière d'un Être miséricordieux.",""],
    ["salaatul-awliyaahi-ar","Salaatul-Awliyaahi-ar","صَلَاةُ الْأَوْلِيَاءِ","10P0qlB_gFUur77-OYDzMWSz1pygGumHx","La prière des saints, hymne d'amour divin.",""],
    ["salahi-bi-fadlilla","Salahi bi fadlilla","صَلَاحِي بِفَضْلِ اللَّهِ","1yNDXmvpLFytr09a5XqKhxpG9ZEmrAdlH","Ma vertu vient de la grâce d'Allah.",""],
    ["salatun-wa-taslimun","Salatun wa taslimun","صَلَاةٌ وَتَسْلِيمٌ","15Vfhh_uUCJ82fBWX8qfbVY5egFvS_r5Q","Prière et paix, salutations ininterrompues sur le Prophète.",""],
    ["sanuqrihuka-ar","Sanuqrihuka-ar","سَنُقْرِئُكَ","1-2UFNDzcFrc_VQylXbGIn3tWqBkwD3AA","Nous te ferons réciter, poème évoquant la promesse coranique.",""],
    ["saxru-ramadaan","Saxru Ramadaan","شَهْرُ رَمَضَانَ","1-Gh15Zzs6VjLvuMo-Ssyd5RZTZIeGK8Z","Le mois de Ramadan, bénédiction du jeûne.",""],
    ["saxru-ramadaana-sakartu-rabbiya","Saxru ramadaana sakartu rabbiya","شَهْرُ رَمَضَانَ شَكَرْتُ رَبِّي","1HCeLZDJfJhGcRW5WQnO46rzQfkgLQyUb","Au mois de Ramadan, j'ai rendu grâce à mon Seigneur.",""],
    ["shahbaanu-bamsasin-kuniya","Shahbaanu bamsasin kuniya","شَعْبَانُ","1tZJu3b63ufsXQ2wZihOdrgIqBSNejYDL","Prière nocturne et bénédictions de Cha'ban.",""],
    ["shahbaanu-shaxidati","Shahbaanu Shaxidati","شَعْبَانُ شَهِدَتِ","1_0lfVlsNlJvPg002PEHlGcOiBPn3ikh4","Cha'ban a été témoin, attestation de foi.",""],
    ["shakawtu","Shakawtu","شَكَوْتُ","1d9E35UzEcX7qm5XyRdrJINh7TJnfeSkw","Je me suis plaint à Toi, plainte mystique vers Dieu.",""],
    ["shifa-an-min-kuli-da-in","Shifa-an min kuli da-in","شِفَاءً مِنْ كُلِّ دَاءٍ","1zSol3grXSAvcOfo7dnYNe5IV0fw3v0f_","Une guérison pour tout mal, poème protecteur.",""],
    ["sifaatu-saadiqil-murid","Sifaatu Saadiqil Murid","صِفَاتُ الصَّادِقِ الْمُرِيدِ","1j4iLEDziyRp_wQ6VqeEnz7lYnPguiBks","Les qualités de l'aspirant véridique, éducation spirituelle.",""],
    ["silkul-jawahir-fr","Silkul-Jawahir-fr","سِلْكُ الْجَوَاهِرِ","1hq-MZvg48l6R_TbdmxTFeHpW-OtMWlNy","Le collier de joyaux, sublime recueil (Traduction FR).",""],
    ["sindidi-ar","Sindidi Ar","صِنْدِيدِي","1l6H_cgOu0Oh-BYTkZegcz405AliTxMug","Le courageux, poème épique de bravoure spirituelle et de foi.",""],
    ["sullamul-firdawsi","Sullamul Firdawsi","سُلَّمُ الْفِرْدَوْسِ","1c97GSW65lzELuYcMXYy587Tq_xaYiKWx","L'échelle du Paradis, pour l'ascension spirituelle.",""],
    ["sultaanun","Sultaanun","سُلْطَانٌ","1Q9Jet-4NccsjAtolMyF4BuAIdF_EGh-y","Autorité et puissance de Dieu.",""],
    ["sulumul-fat-hi","Sulumul Fat-hi","سُلَّمُ الْفَتْحِ","1oVACdXA5dhYudvfWmiSyTI5h4jg4GCoL","L'échelle de l'ouverture spirituelle.",""],
    ["suratul-kahf","Suratul Kahf","سُورَةُ الْكَهْفِ","1wlM0B5fk9W5lulEAxI9Kqb4j0Fi3_Sec","Célébration et bienfaits de la lecture de la Caverne.",""],
    ["taqriibul-aqsaa-ar","Taqriibul-Aqsaa-ar","تَقْرِيبُ الْأَقْصَى","1xShlxdz5wUO-9Ks6ObyDcB2VJCTLNzb4","Le rapprochement de ce qui est éloigné.",""],
    ["tawbatun-nasuuh","Tawbatun nasuuh","تَوْبَةٌ نَصُوحٌ","139mB-APzy_ruky3qxKzGShfzH_viTXWB","Un repentir sincère, invocation poignante.",""],
    ["taysiir","Taysiir","تَيْسِيرُ","1cBKZ0NI2pPJq4GmCCfn4T7451sifHN3N","La facilitation, prière d'aplanissement des difficultés.",""],
    ["taysirul-assir","Taysirul Assir","تَيْسِيرُ الْعَسِيرِ","1ScxkQ4VB0Afl2oL6xgHvH_kHVVT4AMY-","La facilitation de ce qui est difficile.",""],
    ["taysirul-hafaar-fi-jawaabi-habdil-khaadiri","Taysirul Hafaar fi jawaabi habdil khaadiri","تَيْسِيرُ الْغَفَّارِ فِي جَوَابِ عَبْدِ الْقَادِرِ","1rQqqdrLAdoANiCr1s6JYyPx9ZPw31plo","La facilitation du Pardonneur en réponse à Abdou Khadr.",""],
    ["touhfatoul-mutadarihiin","Touhfatoul Mutadarihiin","تُحْفَةُ الْمُتَضَرِّعِينَ","1ybWMyBFfHk3w5y3CcOnh6PHkLc3-a0pz","Le présent offert aux suppliants, prière d'invocation.",""],
    ["tuhfatul-awaa-taxmiss","Tuhfatul awaa Taxmiss","تُحْفَةُ ... تَخْمِيسٌ","161LdM_hkWTHx216ZMOaB8Rbe-S-jddk2","Le présent (Takhmis), poème structuré en quintil.",""],
    ["wa-alkhaytu-halayka","Wa alkhaytu halayka","وَأَلْقَيْتُ عَلَيْكَ","1svYBiLYOJewwG8gjiONCjp_gyYqJ5OVS","Et J'ai répandu sur toi... ode à l'amour divin.",""],
    ["wa-ibaadu-rahmaani","Wa Ibaadu RAHMAANI","وَعِبَادُ الرَّحْمَنِ","1CCnqNVgs6qCkVPjVgol8trEvg8vI-e9T","Les serviteurs du Tout-Miséricordieux.",""],
    ["wa-innaka-lahala","Wa innaka lahala","وَإِنَّكَ لَعَلَى","1C5e_iMyfe5XdgE_RxCaKLf1EPqvRl8bn","Et tu es certes d'un caractère éminent (sur le Prophète).",""],
    ["wa-innaxoo-lakitaabun-hanziizun","Wa Innaxoo lakitaabun hanziizun","وَإِنَّهُ لَكِتَابٌ عَزِيزٌ","1YCVoQpcMb3BfFYfih0tJGNJqtjMyo4BW","C'est certes un Livre Puissant.",""],
    ["wa-ufawwidu-amriya-ilal-laahi","wa ufawwidu amriya ilal LAAHI","وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ","1BZ--y-2q-OoIwkwj0ZvZL41RMp0wPNWs","Je confie mon sort à Allah, summum de la remise à Dieu.",""],
    ["wa-wasaynaal-insaana-bi-waalidayxi-husnan","Wa wasaynaal Insaana bi waalidayxi husnan","وَوَصَّيْنَا الْإِنْسَانَ بِوَالِدَيْهِ حُسْنًا","1yl8grZBbnOxGsrIem9_yzLy2qqSH-Mzi","Et nous avons enjoint à l'homme la bonté envers ses parents.",""],
    ["wa-wassaynal-insaana","Wa Wassaynal Insaana","وَوَصَّيْنَا الْإِنْسَانَ","1Ibn2Fq2E53HdTG7lZZF1khIha27J43Xg","Rappel poétique de l'injonction de la bonté.",""],
    ["wa-yakhlukhu-maalaa-tahlamouna","Wa yakhlukhu maalaa tahlamouna","وَيَخْلُقُ مَا لَا تَعْلَمُونَ","1Yu6yX_gASJkIeA4FmKGRV0oErA0yjRIz","Et Il crée ce que vous ne savez pas, sur les mystères de la Création.",""],
    ["wadieuhtou-lilahi-hamdane","Wadieuhtou lilahi hamdane","وَجَّهْتُ لِلَّهِ حَمْدًا","1Rd-NCa7ok83ALmCYHlGw_QMy_IWNP1Kq","J'ai dirigé ma louange vers Allah.",""],
    ["wadjahatnis","Wadjahatnis","وَجَّهَتْنِي","1qVkWZ6Ds5-5wX9-ltE6aeGNcWaogGRcR","Elle m'a orienté... Prière de direction.",""],
    ["wadjahtou-lil-haadi","Wadjahtou lil Haadi","وَجَّهْتُ لِلْهَادِي","19jBU2zm8u22AZ71KIrzvc3YZRpT5mZZw","Je me suis tourné vers Le Guide.",""],
    ["wadjahtou-lillahi-hamdane","Wadjahtou Lillahi Hamdane","وَجَّهْتُ لِلَّهِ حَمْدًا","13pK5BAn7la3XCgp3ftD9dY0R7ahajkuN","J'ai orienté ma louange purement vers Dieu.",""],
    ["wadjahtou-wajhiyajah","Wadjahtou Wajhiyajah","وَجَّهْتُ وَجْهِيَ","1zXlKZl5HcS58m-0iud5mG-XJ18xiJNTt","J'ai orienté mon visage, prière de soumission totale au Créateur.",""],
    ["wajaba-hamdou","Wajaba Hamdou","وَجَبَ الْحَمْدُ","13pG6Cy0sk4FAXmRT4UwoP3j3oRPCOjmc","La louange est une obligation, chant de gratitude.",""],
    ["wajabahamdoul-lahi-wa-salatou","Wajabahamdoul lahi wa salatou","وَجَبَ الْحَمْدُ لِلَّهِ وَالصَّلَاةُ","11hbiTcOw6wc3yNfvBOktgYef6KXwLywe","Il est obligatoire de louer Dieu et de prier (sur le Prophète).",""],
    ["wajabahamdourabbiyal-hanziimi","Wajabahamdourabbiyal hanziimi","وَجَبَ حَمْدُ رَبِّيَ الْعَظِيمِ","19LtlMnG5yzkGDAPxeM9Ww9s_qis2oep_","La louange à mon Seigneur, L'Immense, est impérative.",""],
    ["wajahtu-abkara-amdahi-liman-fudala","Wajahtu abkara amdahi liman fudala","وَجَّهْتُ أَبْكَارَ أَمْدَاحِي لِمَنْ فُضِّلَ","1N3ruXi2bqbnpIR4Fs0oRLsZ1u8xc6qkp","J'ai dédié les prémices de mes louanges à Celui qui a été préféré.",""],
    ["wakaana-haqan-haleyna","Wakaana haqan haleyna","وَكَانَ حَقًّا عَلَيْنَا","14vuoTYtbV_Jb6Rz8cjA9CUpLTERDFHwD","Et il est de Notre devoir de secourir les croyants.",""],
    ["wakhi-serigne-bi","Wakhi Serigne bi","كَلَامُ الشَّيْخِ","1dmm6abO50VwDzRYf9BhvO6qU93g3PoTa","Les paroles lumineuses du guide spirituel.","Serigne Aladji MBACKE"],
    ["walaqad-karamna","Walaqad karamna","وَلَقَدْ كَرَّمْنَا","1lMDl4Kr6SdCwJObow5TIymFN5CYql4_K","Certes, Nous avons honoré (les fils d'Adam).",""],
    ["wallaahu-yahsimuka-minan-naasi-waqaanii","Wallaahu yahsimuka minan naasi Waqaanii","وَاللَّهُ يَعْصِمُكَ مِنَ النَّاسِ / وَقَانِيَ","11Q_VB7QSxIDQk5gJxcpJ45NFhz9RZZkm","Dieu te protégera des gens. Poème de la sauvegarde inébranlable.",""],
    ["wasful-muriidi","Wasful Muriidi","وَصْفُ الْمُرِيدِ","1wibkoqs66ibM0X6TvCBEk2S1ab60WvsD","La description du Mouride, guide de conduite.",""],
    ["wasilatu-rubohi","wasilatu rubohi","وَسِيلَةُ الرُّبُوعِ","10f97xT-yePoSGpI4568ZlIT9Q6pTh1Pj","Le moyen d'atteindre les demeures célestes.",""],
    ["wattaquul-laaha","Wattaquul LAAHA","وَاتَّقُوا اللَّهَ","1QSx3JxQ-NU8023HCeB1gsYd4rgPW97aw","Et craignez Allah, poème d'exhortation à la piété.",""],
    ["wazkuruu-laaha-fii-ayyaamin-mahduudaatin","wazkuruu LAAHA fii Ayyaamin Mahduudaatin","وَاذْكُرُوا اللَّهَ فِي أَيَّامٍ مَعْدُودَاتٍ","1GEwyLfeqbqNLQr3BhSktZXR0A9QUjvwb","Évoquez Dieu pendant des jours comptés.",""],
    ["widaadi-wa-shoukri-muraadiya-qad-kammalta","Widaadi wa shoukri - Muraadiya qad kammalta","وِدَادِي وَشُكْرِي - مُرَادِيَ قَدْ كَمَّلْتَ","1zxITFxK2q8Ekrhbpb4bQhzcaxJPdqFXF","Mon amour et ma gratitude - Tu as exaucé tous mes vœux.",""],
    ["wird-mahuz-al-kaamil","Wird Mahuz - Al Kaamil","وِرْدُ مَحُوظٍ - الْكَامِلِ","1PvS7H11GXxcW6yMAZ6usOag7Nloqgjia","Le Wird complet, formule de prières régulières.",""],
    ["wird-mahuz-al-khatam-v3","Wird Mahuz - Al khatam v3","وِرْدُ مَحُوظٍ - الْخَتْمِ","1u7URHVzG2RWMWpM1wchNtbx7-83qW2uE","Le Wird (Clôture v3), formule d'achèvement.",""],
    ["woudohou","Woudohou","وُضُوءُ","1U_IwlFJ-RXgzBOc8V-dy3kaMkLv2AfZU","Poème didactique sur les ablutions purificatrices.",""],
    ["xaazal-qawla","Xaazal qawla","هَذَا الْقَوْلَ","1_ENxrOoHeon4JMts1Mra1tcyCu-zeYJX","Cette parole, méditation et transmission de sagesse.",""],
    ["xarnu-bi-wolof","Xarnu-BI-wolof","قَرْنُ بِي","1wlatS__jlMOQI-Zj3F7gh9YHefzDXtxi","Le siècle (en Wolof), avertissements sur son époque.",""],
    ["xasida-ataaba-lil-mamarra","Xasida Ataaba Lil mamarra","أَطَابَ لِلْمَمَرِّ","1UuJIpw6J13pPVta7Q1iDkqQaDqD-X3ix","Il a rendu le passage agréable, hymne du voyage éternel.",""],
    ["xasida-kun","Xasida KUN","قَصِيدَةُ كُنْ","19B2_p3j_ql8Sdj9kYu-JBj7KefB-t0ug","Le poème du \"Sois\" (Kun), sur la toute-puissance de la volonté divine.",""],
    ["xasida-yasurru","Xasida Yasurru","قَصِيدَةُ يَسُرُّ","1EsJGedu_N71L_v4gxMrTxu2Rt0zyQOrv","Le poème qui réjouit l'âme.",""],
    ["xassida-ayatul-kursiyu","Xassida Ayatul kursiyu","آيَةُ الْكُرْسِيِّ","1qmtOLRQqOIcKWropn1wyelBpjSCZc1Mg","Méditation et prière autour du Verset du Trône.",""],
    ["xassidatani","Xassidatani","قَصِيدَتَانِ","1FmZfnai9fwSEWgg_wOPB83q-NKKXwQFa","Deux odes de glorification.",""],
    ["xurratul-ayni","Xurratul ayni","قُرَّةُ الْعَيْنِ","1RMsIvI1qYcYDEt3yiZXCRxel12UFr3ea","La joie des yeux (l'apaisement), panégyrique de bonheur.",""],
    ["ya-rabi","Ya Rabi","يَا رَبِّ","1hFdaGG_pG3Bhs1DRiBXcP0QgAM1VSoUE","Ô mon Seigneur, appel plein de ferveur.",""],
    ["yaa-joumlatane","Yaa Joumlatane","يَا جُمْلَةً","1j60UbXNrgLSH14ExRLLNE33UMVu6hxZ7","Invocation par l'ensemble des perfections.",""],
    ["yaa-kitaabal-kariimi","Yaa kitaabal Kariimi","يَا كِتَابَ الْكَرِيمِ","11fNufMCEGc3YOt2dPgH8VpHsCmKKlb25","Ô Livre du Très-Généreux, hommage au Coran.",""],
    ["yaa-man-kafaanii","Yaa man kafaanii","يَا مَنْ كَفَانِي","1vA5wT4bCK4zDJl5crRO3aYtbQwsGqoxP","Ô Celui qui me suffit en toute chose.",""],
    ["yaa-moukrimaa-yaa-khayra","Yaa Moukrimaa-Yaa Khayra","يَا مُكْرِمًا - يَا خَيْرَ","1Ye-5uSf6Ypk7MD2w0Noafm1XfH_cOpqb","Ô Celui qui honore, Ô Meilleur...",""],
    ["yaa-mukrimad-dayfi","Yaa mukrimad dayfi","يَا مُكْرِمَ الضَّيْفِ","1MA5dbCTle8B8d20uIFT4zIZ8UXdqv_ZP","Ô Celui qui honore l'Hôte (l'Eternel accueillant).",""],
    ["yaa-rabbi-bil-mustafaa","Yaa rabbi bil Mustafaa","يَا رَبِّ بِالْمُصْطَفَى","1VdWfdVQKKGpWwlfNIGcV3Z9tZb2iuC_f","Ô Seigneur, par l'intercession de l'Élu.",""],
    ["yaa-xayra-dayfin","Yaa xayra dayfin","يَا خَيْرَ ضَيْفٍ","13sc4ABMVtZB43KAAcTknVC9ml67A9wBR","Ô le Meilleur des hôtes, ode au Prophète ou au Ramadan.",""],
    ["yaa-zal-busharati","yaa zal busharati","يَا ذَا الْبُشَارَاتِ","17E3Wa_lIBoJe_jTh-9uDPhIQ6yPLCX1y","Ô Détenteur des annonces de bonne nouvelle.",""],
    ["yaa-zal-hantaayaa","Yaa Zal Hantaayaa","يَا ذَا الْعَطَايَا","1uarSniJ7wgGGs3DbV_rThqJI90wzGmtU","Ô Détenteur des dons incommensurables.",""],
    ["yaa-zal-wujuudi","Yaa zal wujuudi","يَا ذَا الْوُجُودِ","1YTw83vqgf9zkgCQ_oXgCG5Shla6hhGuX","Ô Maître de l'Existence.",""],
    ["yaakhayradayfine-fr","YaaKhayraDayfine-fr","يَا خَيْرَ ضَيْفٍ","1pkK9LxgmCasayFI2f_bgsoxcTszg1oYy","Ô le Meilleur des hôtes (Traduction française).",""],
    ["yakhini-kitabul-lahi","Yakhini kitabul Lahi","يَقِينِي كِتَابُ اللَّهِ","1Z31XyH8kzLnHGoH1tc6Y202dztDKUWnG","Ma certitude absolue est le Livre d'Allah.",""],
    ["yaqiini","Yaqiini","يَقِينِي","156slwzZimf1_Jo4mexXHY8KIo4DVrRxw","Ma certitude, l'affirmation forte de la foi.",""],
    ["yaqiini-kitaabulaahi","Yaqiini Kitaabulaahi","يَقِينِي كِتَابُ اللَّهِ","1b9KTwspNf05pgNMPL5K5tKhRFQOHUlsD","Ma certitude réside dans le Livre d'Allah, poème sur la foi inébranlable.",""],
    ["yaquulu-hanbdul-laahi","Yaquulu hanbdul Laahi","يَقُولُ عَبْدُ اللَّهِ","1RK_63cUwKhnVxzAkg9xMdaQCtGzkIsGH","Le serviteur d'Allah dit... introduction classique.",""],
    ["yarahmanou-yarahimou","Yarahmanou-Yarahimou","يَا رَحْمَنُ يَا رَحِيمُ","1ntAa3dPxauz_hpX3A9zC_H5As34W7Yr6","Ô Tout-Miséricordieux, Ô Très-Miséricordieux.",""],
    ["yassaralil-akramou","YassaraLil Akramou","يَسَّرَ لِيَ الْأَكْرَمُ","1ErtGrjCyK9EvtAf_dTjrdF6NkKt-1Grd","Le Plus Généreux a facilité pour moi.",""],
    ["yawma-arbuhaan-i-rajab","Yawma Arbuhaan i rajab","يَوْمَ الْأَرْبِعَاءِ رَجَب","1K32O1KIbqDv1u-HrqC0S8qzD0W5ckgxo","Le jour de mercredi du mois de Rajab.",""],
    ["yawma-hanshuraa-a-liya","Yawma Hanshuraa a liya","يَوْمَ عَاشُورَاءَ لِي","1LcukxBXJk8jVQ1uOMuJ3t0kNxI8YTu5-","Poème de ferveur pour le jour d'Achoura.",""],
    ["yawma-hanshuraa-a-yawmii","Yawma hanshuraa a yawmii","يَوْمَ عَاشُورَاءَ يَوْمِي","1-s4tFjuCsZPqFsy6gfvXP9S6yyFq44Jr","Le jour d'Achoura est mon jour, d'élévation spirituelle.",""],
    ["yawmal-arbuhaan-i","Yawmal Arbuhaan i","يَوْمَ الْأَرْبِعَاءِ","159M7MKzxEA1lKZIEMKesAzIqTl5xuvGw","Le mercredi de bénédiction.",""],
    ["yawmi-nisfu-shahbaanixii","Yawmi nisfu shahbaanixii","يَوْمَ نِصْفِ شَعْبَانِهِ","11na258PpNatbKa8bXgFrG6ZyHlfipnlc","Le jour de la mi-Cha'ban, célébration de pardon.",""],
    ["yoonou-jaam","Yoonou jaam","طَرِيقُ السَّلَامِ / طَرِيقُ الْعَبْدِ","1w-rfu7vSM03eW4unQoNfo32RPFBA0taC","La voie du serviteur, sur l'humilité devant le Créateur.","Serigne Alaadji MBACKE"],
    ["yoonou-mouride","Yoonou Mouride","طَرِيقَةُ الْمُرِيدِ","1DE87Vpm1UP4A7MH91ruCVenvba5cnapk","La voie du Mouride, enseignements de droiture.","Serigne Aladji MBACKE"],
    ["yoonu-ga-ngu-baax-gna","Yoonu Ga ngu baax gna","طَرِيقُ الصَّالِحِينَ","1h7UfWO-IVHawv3mTdHYXmlRhhY7Jrn-S","Le chemin des hommes pieux et droits.","Serigne Alaadji MBACKE"],
    ["zalat","Zalat","زَالَتْ","1UQcomE2wbFQhXWdDblkM4yqQWFxilsJH","A disparu, poème sur la fin des maux et des peines.",""],
    ["ziyaara-serigne-touba","ziyaara Serigne Touba","زِيَارَةُ شَيْخِ طُوبَى","1xSFk9SU-HG-dYJxLy4JcPB4jzwz3o195","Le grand pèlerinage et l'hommage à Serigne Touba.","Serigne Alaadji MBACKE"],
    ["zul-hijjati","Zul hijjati","ذُو الْحِجَّةِ","1xlFyk9TXq2Dj_24nvA344vFYs5K83_m7","Célébration du mois sacré du Pèlerinage (Hajj).",""],
    ["zul-hijjati-busharun","Zul hijjati busharun","ذُو الْحِجَّةِ بُشَرٌ","1xBAgVV6kHtvIzH6c_kZXtvl0wMFf7q_3","Dhul Hijjah, une bonne nouvelle et joie spirituelle.",""],
];

export const XASSIDAS: Xassida[] = DATA.map(([slug, title, arabic, fileId, desc, author]) => ({
    slug, title, arabic, fileId,
    desc: desc || `Texte de ${author || DEFAULT_AUTHOR}, à lire en ligne ou à télécharger.`,
    author: author || DEFAULT_AUTHOR
}));

export const XASSIDA_BY_SLUG: Record<string, Xassida> = Object.fromEntries(XASSIDAS.map((x) => [x.slug, x]));
/* -------------------------------------------------------------------------- */
/*  LIVRES : une page par livre (/livres/<nom>)                               */
/* -------------------------------------------------------------------------- */
/* Format : [slug, titre, auteur, ID Google Drive, description]
 * Pour ajouter un livre : copiez une ligne et modifiez-la. Le slug doit être unique et ne plus changer. */

export interface Livre {
    slug: string;
    title: string;
    author: string;
    fileId: string;
    desc: string;
}

const LIVRES_DATA: [string, string, string, string, string][] = [
    ["alxuraan-en-wolof", "Alxuraan en Wolof", "ALLAH (SWT)", "1V8S93byxBrqcwSBpo41emWUP3MNY78Da", "Livre de ALLAH (SWT), à lire en ligne ou à télécharger."],
    ["cheikh-ibra-fall", "Cheikh Ibra Fall", "Sheikh Alassane Sène", "1DMmk5X6Gpyf8QiwP20bO5IBqrtDG8cBC", "Livre de Sheikh Alassane Sène, à lire en ligne ou à télécharger."],
    ["xuratul-ayni", "Xuratul Ayni", "Serigne Chouhaybou MBACKE", "1E4Orppn8JrgdTAzS3FvTx9QUjkoEHrz6", "Livre de Serigne Chouhaybou MBACKE, à lire en ligne ou à télécharger."],
    ["wird-maaxuuz", "Wird Maaxuuz", "Cheikh Ahmadou Bamba", "1OvKKR2YWqXs86k4NwSD7cPQ8vSL81Z2_", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["kadduy-serin-mbay-jaxate-v2", "Kàdduy Seriñ Mbay Jaxate (v2)", "Serigne Mbaye Diakhate", "1BFYghrqN4dx65RBFT9bF1Bc0LG_XjkMv", "Livre de Serigne Mbaye Diakhate, à lire en ligne ou à télécharger."],
    ["massalikul-jinaan", "Massalikul Jinaan", "Cheikh Ahmadou Bamba", "1wj8e41e7VHQRLgS0F0Z67aN2SGhmOugs", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["juzz-01", "Juzz 01", "Serigne Samba Diagne", "180LvqEAYkNaLPIOj87yaNwd92v0B_D_z", "Livre de Serigne Samba Diagne, à lire en ligne ou à télécharger."],
    ["irwaa-u-nadiim", "Irwaa-u-nadiim", "Sëriñ Muhammadu Lamin Jóob", "1Gn2VBV60DnWsN2BhHT0AzKTu1a7pzP4G", "Livre de Sëriñ Muhammadu Lamin Jóob, à lire en ligne ou à télécharger."],
    ["jahwarun-nafiis", "Jahwarun Nafiis", "Cheikh Ahmadou Bamba", "17NE18JxqCOqkOp0if2RCnhZ8UswQ1mt_", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["jawaabu-sokhna-penda-diop", "Jawaabu Sokhna Penda DIOP", "Cheikh Ahmadou Bamba", "11cS7_eeMk8XSMMq9RhKsnZ3x-7MKCcN5", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["munawiru-suduur-francais", "Munawiru suduur (français)", "Cheikh Ahmadou Bamba", "1Y5uV8PUF0ssfghgH-Zr4JnzWV5OsEVvf", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["munawiru-suduur-english", "Munawiru suduur (English)", "Cheikh Ahmadou Bamba", "1OtlUNDnSuYETfMzbmVfAmtN7nVyRjwa3", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["nahju-francais", "Nahju (français)", "Cheikh Ahmadou Bamba", "1AUzwgKFKNiFh3Td5JZB0l9n4jrSlhPRq", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["nahju-wolof", "Nahju (wolof)", "Cheikh Ahmadou Bamba", "1hXCKcZl383nhaYoNiFNtbzEKmcOJHlhj", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["ndaxam-ab-murid", "Ndaxam ab murid", "Serigne Mbaye Diakhate", "1hEhGPjy1_SIcxt_NK4XVj4snzKs-MkXG", "Livre de Serigne Mbaye Diakhate, à lire en ligne ou à télécharger."],
    ["niaan-guy-andak-wirdul-manhuuz", "Niaan guy andak Wirdul Manhuuz", "Cheikh Ahmadou Bamba", "1jFcP1UXzTMGS752ll7GJlTI0z8btWKfq", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["niaanu-serigne-bi", "Niaanu Serigne bi", "Cheikh Ahmadou Bamba", "1Oh_4gaMBLSitgolxFl77Zuuv2_hkSz0V", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["niaanuk-nisfu-shahbaan", "Niaanuk nisfu shahbaan", "Cheikh Ahmadou Bamba", "1lSl29kIrETsNmpu2gHD2rAZHSldP4PbO", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["tanwiirus-suduur", "Tanwiirus suduur", "Cheikh Ahmadou Bamba", "1VAVoVLRBz0_TwA0AJCeXWGnlm9Sg8A0k", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["tazawudu-shighar-arabe", "Tazawudu Shighar (arabe)", "Cheikh Ahmadou Bamba", "17lqN34U0pQ3Q31U-YrytWgxPIhhoRyMF", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["tazawudu-shighar-francais", "Tazawudu Shighar (français)", "Cheikh Ahmadou Bamba", "1kHgcoJ2nSYSp-W4x-Q5bW0dCz1n_N_yG", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["tazawwudou-shubban-francais", "Tazawwudou Shubban (français)", "Cheikh Ahmadou Bamba", "1Gn_gjZhZ-OMM5cbtB6b6sovRwwVvlNvv", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
    ["teere-lenn-ci-naani-att-mi", "Téere lénn ci ñaani att mi", "Cheikh Ahmadou Bamba", "1k6k4Skd9UqYthgGO__bEU5etPXN66x8t", "Livre de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger."],
];

export const LIVRES: Livre[] = LIVRES_DATA.map(([slug, title, author, fileId, desc]) => ({ slug, title, author, fileId, desc }));
export const LIVRE_BY_SLUG: Record<string, Livre> = Object.fromEntries(LIVRES.map((l) => [l.slug, l]));

/* -------------------------------------------------------------------------- */
/*  LIENS                                                                     */
/* -------------------------------------------------------------------------- */

const PATH_BY_FILE: Record<string, string> = {
    ...Object.fromEntries(XASSIDAS.map((x) => [x.fileId, `/xassidas/${x.slug}`])),
    ...Object.fromEntries(LIVRES.map((l) => [l.fileId, `/livres/${l.slug}`]))
};

/** Lien vers la page d'une xassida OU d'un livre à partir de son lien Google Drive (utilisé par les listes /xassidas et /livres). */
export function hrefFromDriveUrl(url?: string): string | undefined {
    const id = url?.match(/\/d\/([^/]+)/)?.[1];
    return id ? PATH_BY_FILE[id] : undefined;
}

const lev = (a: string, b: string) => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
};

function closestIn(input: string, slugs: string[]): string | null {
    const s = input.toLowerCase();
    let best: string | null = null;
    let bestD = Infinity;
    for (const slug of slugs) {
        const d = lev(s, slug);
        if (d < bestD) { bestD = d; best = slug; }
    }
    return bestD <= Math.max(2, Math.floor(s.length * 0.15)) ? best : null;
}

/** Adresse la plus proche d'un slug inconnu (corrige les petites fautes, ex. dans un lien du chatbot). */
export const closestSlug = (input: string) => closestIn(input, XASSIDAS.map((x) => x.slug));
export const closestLivreSlug = (input: string) => closestIn(input, LIVRES.map((l) => l.slug));

/* -------------------------------------------------------------------------- */
/*  RECHERCHE (accueil)                                                       */
/* -------------------------------------------------------------------------- */

const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '').replace(/œ/g, 'oe');

// Mots qu'on ignore quand ils accompagnent d'autres mots : titres d'honneur, articles, mots génériques
const STOP = new Set([
    'mame', 'mam', 'serigne', 'serin', 'sokhna', 'sidi', 'sidy', 'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une',
    'et', 'en', 'al', 'el', 'livre', 'livres', 'xassida', 'xassidas', 'khassida', 'texte', 'pdf'
]);

type Entry =
    | { kind: 'xassida'; item: Xassida; title: string; arabic: string; other: string }
    | { kind: 'livre'; item: Livre; title: string; arabic: string; other: string };

let INDEX: Entry[] | null = null;
function getIndex(): Entry[] {
    if (!INDEX) {
        INDEX = [
            ...XASSIDAS.map((item): Entry => ({ kind: 'xassida', item, title: norm(item.title), arabic: norm(item.arabic), other: norm(`${item.author} ${item.desc}`) })),
            ...LIVRES.map((item): Entry => ({ kind: 'livre', item, title: norm(item.title), arabic: '', other: norm(`${item.author} ${item.desc}`) }))
        ];
    }
    return INDEX;
}

/**
 * Recherche tolérante : on découpe la phrase en mots, on ignore « Mame », « Serigne », « livre »…, puis
 * un résultat est retenu si la moitié au moins des mots figurent dans son titre (ou, à défaut, si TOUS les
 * mots figurent quelque part : titre, arabe, auteur, description). Les mieux classés viennent en premier.
 * Exemple : « Mame cheikh ibra Fall » trouve le livre « Cheikh Ibra Fall ».
 */
export function searchCatalog(query: string): { xassidas: Xassida[]; livres: Livre[] } {
    const all = norm(query).split(/[^a-z0-9\u0600-\u06FF]+/).filter((t) => t.length >= 2);
    const filtered = all.filter((t) => !STOP.has(t));
    const tokens = filtered.length ? filtered : all;
    if (!tokens.length) return { xassidas: [], livres: [] };

    const need = Math.max(1, Math.ceil(tokens.length / 2));
    const hits: { e: Entry; score: number }[] = [];
    for (const e of getIndex()) {
        let inTitle = 0;
        let anywhere = 0;
        for (const t of tokens) {
            const t1 = e.title.includes(t) || (e.arabic !== '' && e.arabic.includes(t));
            if (t1) inTitle++;
            if (t1 || e.other.includes(t)) anywhere++;
        }
        if (inTitle >= need || anywhere === tokens.length) hits.push({ e, score: inTitle * 3 + anywhere });
    }
    hits.sort((a, b) => b.score - a.score || a.e.item.title.localeCompare(b.e.item.title, 'fr', { sensitivity: 'base' }));
    return {
        xassidas: hits.filter((h) => h.e.kind === 'xassida').map((h) => h.e.item as Xassida),
        livres: hits.filter((h) => h.e.kind === 'livre').map((h) => h.e.item as Livre)
    };
}
