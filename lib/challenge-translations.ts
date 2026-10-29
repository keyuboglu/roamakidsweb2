type Translation={
  title:string;
  shortDescription:string;
  description:string;
  instructions:string;
  safety:string;
  estimatedTime:string;
  materials:string;
  ageGuidance:{ages6to8:string;ages9to12:string};
  whyInteresting:string;
  optionalSharingPrompt:string;
  imageAlt:string;
};

const time='Süre sınırı yok; kendi temponuzda ilerleyin.';

export const turkishChallenges:Record<string,Translation>={
  'shadow-signal':{
    title:'Gölge Sinyali',
    shortDescription:'Sıradan bir şeyi imkânsız gibi gösterebilir misiniz?',
    description:'Sıradan bir nesneyi olağanüstü bir gölgeye dönüştürün.',
    estimatedTime:time,
    materials:'Güvenli bir ev eşyası, gün ışığı veya oda lambası gibi bir ışık kaynağı ve düz bir duvar ya da yüzey.',
    ageGuidance:{
      ages6to8:'Tanınabilir bir hayvan ya da hayalî bir karakter deneyin.',
      ages9to12:'Daha soyut bir siluet veya birden fazla nesneden oluşan bir düzen deneyin.',
    },
    whyInteresting:'Tanıdık bir nesne beklenmedik bir gölge oluşturabilir; ışık ve hayal gücü bir tahmin oyununa dönüşür.',
    optionalSharingPrompt:'Sıradan bir nesnede gizli bir sinyal bulduk. Siz ne görüyorsunuz?',
    imageAlt:'Bir çocuk küçük bir ışıkla duvarda yaratık şeklinde eğlenceli bir gölge oluşturuyor.',
    instructions:[
      '1. Güvenli, sıradan bir ev eşyası seçin.',
      '2. Gün ışığı, oda lambası veya uygun kullanılan bir el feneriyle düz bir yüzeyde ilginç bir gölge oluşturun.',
      '3. Hayvana, yaratığa, bir yere veya gizemli bir nesneye benzeyen bir şekil arayın.',
      '4. Ailenizden birine “Ne görüyorsun?” diye sorun.',
      '5. Gölgeyi oluşturan nesneyi açıklayın.',
      'Fotoğraf veya video bir tahmin oyunu için kullanılabilir; görevi tamamlamak için ikisi de gerekli değildir.',
    ].join('\n'),
    safety:'Mum, sıcak ampul veya tehlikeli ekipman kullanmayın; tırmanmayın, tehlikeli bir pozisyonda durmayın. Karanlık ya da geceyi beklemek gerekmez.',
  },
  'micro-world-safari':{
    title:'Mikro Dünya Safarisi',
    shortDescription:'Biraz daha yakından baksaydınız ne görürdünüz?',
    description:'Sıradan bir şeyin içinde saklı olağanüstü bir dünya keşfedin.',
    estimatedTime:time,
    materials:'Güvenli ve temiz bir günlük nesne veya ayrıntı. Kamera ya da çizim kâğıdı isteğe bağlıdır.',
    ageGuidance:{
      ages6to8:'Basit dokulara ve şaşırtıcı şekillere odaklanın.',
      ages9to12:'Desenleri arayın, ayrıntıları karşılaştırın veya daha zor bir gizem görseli oluşturun.',
    },
    whyInteresting:'Yakından bakınca bir yaprak, kumaş ya da sünger keşfedilmeyi bekleyen yeni bir manzara gibi görünebilir.',
    optionalSharingPrompt:'Bu minik dünyanın neye ait olduğunu tahmin edebilir misiniz?',
    imageAlt:'Bir çocuk büyüteçle yeşil bir yaprağın ayrıntılı damarlarına bakıyor.',
    instructions:[
      '1. Kumaş, yaprak, kâğıt, sünger veya su damlası gibi güvenli, temiz ve sıradan bir nesne ya da ayrıntı seçin.',
      '2. Desenlerini, dokusunu, kenarlarını veya minik ayrıntılarını inceleyin.',
      '3. İsterseniz yakından fotoğraf çekin, fark ettiğinizi çizin ya da birine anlatın.',
      '4. Birinden ayrıntının hangi nesneye ait olduğunu tahmin etmesini isteyin.',
      '5. Asıl nesneyi gösterin ve keşfinize bir ad verin.',
      'Makro lens, özel ekipman veya uygulama kurulumu gerekmez. Kamera isteğe bağlıdır.',
    ].join('\n'),
    safety:'Tanımadığınız böceklere dokunmayın, yaban hayatını rahatsız etmeyin, tehlikeli bitkileri koparmayın ve güvensiz nesneleri toplamayın.',
  },
  'gravity-defier':{
    title:'Yerçekimine Meydan Oku',
    shortDescription:'Üç nesneyi imkânsız gibi görünen bir şekilde dengeleyebilir misiniz?',
    description:'Sıradan nesnelerle beklenmedik bir şey yapın.',
    estimatedTime:time,
    materials:'Güvenli, hafif üç ev eşyası ve alçak, sabit bir yüzey.',
    ageGuidance:{
      ages6to8:'İki ya da üç nesneyle basit düzenler deneyin.',
      ages9to12:'Daha alışılmadık düzenler ve yaratıcı çözümler deneyin.',
    },
    whyInteresting:'Denge kurmak deneme yanılmayı görünür kılar: küçük değişiklikler şaşırtıcı bir düzeni sabit hale getirebilir.',
    optionalSharingPrompt:'Bunun dengede durmaması gerekiyor… ama duruyor mu?',
    imageAlt:'Bir çocuk hafif ev eşyalarını şaşırtıcı bir şekilde dikkatle dengeliyor.',
    instructions:[
      '1. Güvenli ve hafif üç ev eşyası seçin.',
      '2. Bunları alçak, sabit bir yüzeyde şaşırtıcı ama dengeli bir düzende yerleştirmeyi deneyin.',
      '3. Yapıyı üç saniye ayakta tutmayı hedefleyin.',
      '4. Sonucu göstermeden önce birinden işe yarayıp yaramayacağını tahmin etmesini isteyin.',
      'Yalnızca karton, kâğıt rulosu, sünger veya boş plastik kap gibi uygun ve hafif nesneler kullanın.',
    ].join('\n'),
    safety:'Bıçak, cam, ağır veya kırılabilir eşya kullanmayın; tehlikeli yükseklikte istif yapmayın veya tırmanmayın. Denemeler eğlenceli olmalıdır; başarısızlık da kabul edilebilir bir denemedir ve çocuk asla utandırılmamalıdır.',
  },
};
