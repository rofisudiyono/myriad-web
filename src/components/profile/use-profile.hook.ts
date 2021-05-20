// @ts-nocheck
import { useState, useEffect } from 'react';

import { ExtendedUserPost } from 'src/interfaces/user';
import * as ProfileAPI from 'src/lib/api/profile';

export const useProfileHook = id => {
  const [profile, setProfile] = useState<ExtendedUserPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('masuk');
    getProfile();
  }, []);

  const getProfile = async () => {
    setLoading(true);

    try {
      let detail: ExtendedUser = await ProfileAPI.getUserProfile(id as string);

      if (!detail.posts) {
        detail.posts = [];
      }

      setProfile({
        ...detail
      });
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // const updateProfile = async (attributes: Partial<User>) => {
  //   setLoading(true);

  //   try {
  //     const { data } = await MyriadAPI({
  //       url: `/users/${user.address}`,
  //       method: 'PATCH',
  //       data: attributes
  //     });

  //     setProfile({
  //       ...profile,
  //       ...attributes
  //     });
  //     console.log('>>>>', attributes);
  //   } catch (error) {
  //     setError(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return {
    error,
    loading,
    profile
    // updateProfile
  };
};
