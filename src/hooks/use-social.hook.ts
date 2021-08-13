import React from 'react';

import getConfig from 'next/config';

import Axios from 'axios';
import {format} from 'date-fns';
import {Post} from 'src/interfaces/post';
import {parseTwitter, PostDetail} from 'src/lib/parse-social.util';

const {serverRuntimeConfig} = getConfig();

const client = Axios.create({
  baseURL: serverRuntimeConfig.nextAuthURL,
});

const createMarkdownContent = (post: Post): string => {
  let content = '';

  if (post.title) {
    content += `## ${post.title}\n\n`;
  }

  if (post.text) {
    content += `${post.text}`;
  }

  return content;
};

export const useSocialDetail = (post: Post) => {
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<PostDetail | null>(null);

  const loadPost = async () => {
    try {
      const {data} = await client({
        method: 'GET',
        url: '/api/content/twitter',
        params: {
          id: post.originPostId,
          type: 'twitter',
        },
      });

      if (!data.errors) {
        const lookup = parseTwitter(data);

        setDetail(lookup);

        setLoading(false);
      }
    } catch (error) {
      setDetail(null);
    }
  };

  React.useEffect(() => {
    if (post.platform === 'twitter') {
      loadPost();
    } else {
      setDetail({
        text: createMarkdownContent(post),
        createdOn: format(new Date(post.originCreatedAt || post.createdAt), 'dd MMMM yyyy'),
        videos: [],
        images: [],
        metric: {
          like: 0,
          retweet: 0,
        },
        user: {
          name: post.people?.name || '',
          avatar: post.people?.profilePictureURL || '',
          username: post.people?.username || '',
        },
      });

      setLoading(false);
    }
  }, [post]);

  return {
    loading,
    detail,
  };
};
