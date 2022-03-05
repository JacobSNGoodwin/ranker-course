import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import BottomSheet from '../components/ui/BottomSheet';

export default {
  title: 'BottomSheet',
  component: BottomSheet,
  argTypes: { onClose: { action: 'closing' } },
  args: {
    isOpen: true,
  },
} as ComponentMeta<typeof BottomSheet>;

const Template: ComponentStory<typeof BottomSheet> = (args) => (
  <div className="max-w-sm m-auto h-screen relative">
    <BottomSheet {...args} />
  </div>
);

export const OpenBottomSheetShort = Template.bind({});
OpenBottomSheetShort.args = {
  children: (
    <div className="p-12">
      Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nobis, facere
      quia enim ut, ad molestiae natus illum rem harum suscipit consectetur
      voluptatem incidunt. Id adipisci eius architecto vitae, rem quia cum velit
      totam deleniti repudiandae asperiores, et delectus tempore necessitatibus
      beatae aspernatur quasi sapiente, labore reiciendis nemo? Hic, eveniet
      officiis!
    </div>
  ),
};

export const OpenBottomSheetLong = Template.bind({});
OpenBottomSheetLong.args = {
  children: (
    <div className="p-12">
      Lorem ipsum dolor, sit amet consectetur adipisicing elit. Iste soluta
      voluptates, unde, at assumenda fugit fuga molestias earum architecto non,
      nostrum placeat harum accusantium nisi odit amet vel natus est dolores
      quidem commodi? Praesentium, expedita ratione! Cumque non quod odit
      laudantium tempora laborum nesciunt iure vel, consequatur voluptate ipsam
      vero? Lorem ipsum, dolor sit amet consectetur adipisicing elit. Qui sunt
      ab maiores perspiciatis eligendi sapiente veniam officiis maxime autem
      distinctio illo et ut amet earum sit odit error ullam adipisci minima
      repudiandae, eveniet aliquid dolore necessitatibus! Impedit ea omnis
      suscipit, magni et pariatur maxime porro, distinctio, ipsam mollitia
      dolorum officia! Lorem ipsum dolor sit amet consectetur adipisicing elit.
      Consectetur, libero quod distinctio architecto repellat obcaecati mollitia
      laudantium ex dolor in? Quisquam ipsam fugiat, est placeat vero eius
      ratione suscipit repellat quam doloremque necessitatibus ad sint commodi
      nobis laboriosam dolore et veritatis fuga cumque sed reiciendis, soluta
      atque? Vel, doloribus cum? Lorem ipsum dolor sit amet consectetur,
      adipisicing elit. Consequatur natus voluptas reprehenderit magnam
      provident magni quam porro voluptates iure minima. Voluptates aliquam
      obcaecati accusantium esse consequuntur voluptate sunt reiciendis nam
      ullam! Quam recusandae odio aut, ullam illum aperiam! Veniam, soluta quo!
      Delectus expedita magnam praesentium laborum, rerum molestiae iste
      debitis. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quod
      earum corrupti similique placeat. Sint obcaecati dicta nulla rerum qui
      rem, repellat adipisci optio magnam excepturi ratione consequuntur iusto
      perspiciatis deserunt neque, animi enim quam? Similique quaerat
      voluptatem, officiis saepe laboriosam iste eum ex. Reprehenderit sed
      reiciendis libero blanditiis ipsam. Et in laboriosam ipsum magni
      molestiae, distinctio esse, dolorum nostrum totam alias facere nam illo
      pariatur maxime itaque similique. At sit odit nulla dolor accusamus amet,
      facere cupiditate quasi iure dicta minus praesentium veritatis consequatur
      nemo. Non, voluptatibus! Nesciunt, molestias reprehenderit. Ipsum adipisci
      quia dolores tempore doloremque esse ullam, eius delectus? Itaque sapiente
      ipsa quidem nesciunt quaerat quisquam maxime deleniti architecto nam at
      nulla amet vitae, maiores laudantium adipisci, voluptas porro magnam
      officia sunt doloribus? Reprehenderit nisi corrupti pariatur omnis est
      aspernatur voluptatem facere expedita sed doloremque quisquam praesentium
      asperiores voluptatum natus fugiat voluptatibus rerum unde modi eveniet
      dolorum tenetur, et repellat sit doloribus! Consequuntur, expedita beatae
      quis eos veritatis accusamus, odit fugit at cumque sapiente sit velit,
      excepturi magnam! Ad earum aliquid odio sapiente. Rem cum debitis quod
      ipsa error at nam atque libero neque est et recusandae, dolorem, amet
      temporibus molestias corrupti eaque ipsum velit tempora saepe porro
      laborum quam voluptate? Inventore blanditiis sequi aperiam, doloribus
      harum corporis dignissimos molestiae, expedita magnam laudantium quia
      dolorem fugiat voluptates ratione cupiditate iste eum qui tempore deserunt
      libero? Voluptatem neque beatae, iste hic illo ex modi, obcaecati quis
      iure suscipit impedit cupiditate fugit, harum recusandae? Officiis veniam
      qui atque mollitia, dolores dolorum?
    </div>
  ),
};
