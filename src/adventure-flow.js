export function getAdventureSceneSwitchGuard(activeRun, targetScene, routeScene) {
  if (!activeRun || targetScene?.id === activeRun.sceneId) {
    return { canSwitch: true, notice: "" };
  }

  const routeName = activeRun.routeName ?? "当前冒险";
  const sceneName = routeScene?.name ?? "目标场景";
  return {
    canSwitch: false,
    notice: `${routeName}进行中：先在${sceneName}处理当前事件`,
  };
}
