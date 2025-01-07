"use server";

import insertClass, { type Data } from '~/server/actions/insertClass'
import { revalidatePath } from 'next/cache'
import type { StudentField } from '~/server/db/types'
import { LoremIpsum } from "lorem-ipsum";
import type { StudentId } from '~/server/actions/insertClass'
import { auth } from '@clerk/nextjs/server';

const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4
    },
    wordsPerSentence: {
      max: 16,
      min: 4
    }
});

const currentYear = new Date().getFullYear()
const completeClassDemo: Data = {
  class_id: undefined,
  class_name: "Demo, Complete",
  class_language: 'en',
  class_grade: '5',
  class_year: String(currentYear),
  role: 'primary',
  fileContents: `number,sex,name_ko,name_en
1,f,이지현,Lee Jihyun
2,m,박민수,Park Minsu
3,f,김수정,Kim Sujeong
4,m,이현우,Lee Hyunwoo
5,m,정우성,Jung Woosung
6,f,최수연,Choi Suyeon
7,f,오누리,Oh Nuri
8,m,김민준,Kim Minjun
`,
}
const incompleteClassDemo: Data = {
  class_id: undefined,
  class_name: "Demo, Incomplete",
  class_language: 'en',
  class_grade: '5',
  class_year: String(currentYear),
  role: 'primary',
  fileContents: `number,sex,name_ko,name_en
1,f,김유진,Kim Yujin
2,m,이도현,Lee Dohyun
3,f,박민지,Park Minji
4,m,최준영,Choi Junyoung
5,m,한동훈,Han Donghoon
6,f,정하나,Jung Hana
7,f,윤서연,Yoon Seoyeon
8,m,류재민,Ryu Jaemin
`,
}
export default async function addDemoClasses() {
    const { userId } = auth()
    if (!userId) throw new Error("User not authenticated:")
    // Insert complete demo class
    const completeStudentIds: string = await insertClass(completeClassDemo, userId, true, "template") 
    const completeStudentIdsJson: StudentId[] = JSON.parse(completeStudentIds) as StudentId[]
    const completeData = completeStudentIdsJson.map(student => {
      /*
        1.  
        Generate Absent Dates
        2. 
      */
      
    })

    revalidatePath("/classes")
}