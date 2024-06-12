import axios, { AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 3, // number of retries
  retryDelay: (retryCount) => {
    console.log(`retry attempt: ${retryCount}`);
    return retryCount * 2000; // time interval between retries
  },
});

const getDistrictToken = async (): Promise<AxiosResponse | undefined> => {
  try {
    const response: AxiosResponse = await axios.get('https://clever.com/oauth/tokens?owner_type=district', {
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`${process.env.CLEVER_CLIENT_ID}:${process.env.CLEVER_CLIENT_SECRET}`).toString('base64'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching distric token:', JSON.stringify(error));
  }
};

const callClever = async (endpoint: string, token: string): Promise<AxiosResponse | undefined> => {
  try {
    const response: AxiosResponse = await axios.get(`https://api.clever.com/v3.0/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

const callUpgrade = async (body: UpgradeUser[]): Promise<AxiosResponse | undefined> => {
  try {
    const response: AxiosResponse = await axios.post(process.env.UPGRADE_ENDPOINT || '', body, {
      headers: {
        Authorization: `Bearer ${process.env.UPGRADE_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error posting data to UpGrade:', error);
  }
};

async function main(): Promise<void> {
  const districData: AxiosResponse | undefined = await getDistrictToken();

  const districtToken: string = districData?.data.find(
    (district: DistrictData) => district.owner.id === process.env.DISTRICT_ID
  ).access_token;

  const userDataFromClever: AxiosResponse | undefined = await callClever('users', districtToken);

  const sectionDataFromClever: AxiosResponse | undefined = await callClever('sections', districtToken);

  const sectionsPerStudent = sectionDataFromClever?.data.reduce(
    (studentSections: { [key: string]: string[] }, section: SectionData) => {
      if (section.data.students) {
        section.data.students.forEach((studentId: string) => {
          studentSections[studentId] = [...(studentSections[studentId] || []), section.data.id];
        });
      }
      return studentSections;
    },
    {}
  );

  const studentSchools = userDataFromClever?.data
    .filter((user: User) => user.data.roles.student)
    .reduce((schoolsPerStudent: { [key: string]: string[] }, student: User) => {
      schoolsPerStudent[student.data.id] = student.data.roles.student?.schools || [];
      return schoolsPerStudent;
    }, {});

  const students = [...new Set([...Object.keys(studentSchools), ...Object.keys(sectionsPerStudent)])];

  const studentDataForUpGrade: UpgradeUser[] = students.map((studentId: string) => ({
    id: studentId,
    group: {
      classId: sectionsPerStudent[studentId] || [],
      schoolId: studentSchools[studentId] || [],
    },
  }));

  const upGradeResponse = await callUpgrade(studentDataForUpGrade);

  console.log(upGradeResponse);
}

main();

interface DistrictData {
  id: string;
  created: string;
  owner: { type: string; id: string };
  access_token: string;
  scopes: string[];
}

interface SectionData {
  data: {
    course: string;
    created: string;
    district: string;
    grade: string;
    last_modified: string;
    name: string;
    period: string;
    school: string;
    section_number: string;
    sis_id: string;
    students: string[];
    subject: string;
    teacher: string;
    teachers: string[];
    term_id: string;
    id: string;
  };
  uri: string;
}

interface Student {
  credentials: {
    district_username: string;
  };
  enrollments: {
    end_date: string;
    school: string;
    start_date: string;
  }[];
  school: string;
  schools: string[];
  sis_id: string;
  state_id: string;
  student_number: string;
  email: string;
}

interface UserData {
  created: string;
  district: string;
  email: string;
  last_modified: string;
  name: {
    first: string;
    last: string;
    middle?: string;
  };
  id: string;
  roles: {
    district_admin?: any;
    student?: Student;
  };
}

interface User {
  data: UserData;
  uri: string;
}

interface UpgradeUser {
  id: string;
  group: {
    [key: string]: string[];
  };
}
