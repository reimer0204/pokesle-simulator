<template>
  <div class="page">

    <div class="tab-list mb-10px">
      <router-link to="/data/pokemon">ポケモン</router-link>
      <router-link to="/data/pokemon-food">ポケモン(食材期待値)</router-link>
      <router-link to="/data/pokemon-skill">ポケモン(スキル期待値)</router-link>
      <router-link to="/data/food">食材</router-link>
      <router-link to="/data/cooking">料理</router-link>
    </div>

    <router-view />
  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  height: 100%;

  .tab-list {
    display: flex;
    border-bottom: 3px #CCC solid;

    & > a {
      padding: 5px 15px;
      text-decoration: none;
      color: inherit;

      &.router-link-active {
        font-weight: bold;
        border-bottom: 3px #08C solid;
        margin-bottom: -3px;
        color: #08C;
      }
    }
  }

  .scroll {
    flex: 1 1 0;
    overflow: auto;
    position: relative;
  }

  .pokemon-list {
    img {
      width: 24px;
      height: 24px;
    }
  }

  .food {
    width: 24px;
    height: 24px;
    padding: 1px;
    position: relative;

    &.disabled {
      opacity: 0.5;
    }
    &:not(.disabled) {
      background-color: #FFF;
      border-radius: 3px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    img {
      width: 100%;
    }

    .num {
      position: absolute;
      right: 2px;
      bottom: -2px;
      font-weight: bold;
      font-size: 80%;

      text-shadow:
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF;
    }
  }

  .percentile {
    color: #04C;
    border-bottom: 1px #04C solid;
    cursor: pointer;

    &:hover {
      background-color: #DEF;
    }
  }
}

</style>